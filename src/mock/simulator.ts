import {
  NodeTelemetry,
  EventType,
  RiskState,
  Alert,
  SMSLog,
  SimulationControlState,
  TransientDataPoint,
} from '../types';
import { INITIAL_NODES, INITIAL_PIPE_SEGMENTS } from './seedData';
import { getEpanetExpectedValues, isWaterSupplyScheduled } from './epanetBaselines';

export type SimulatorEvent =
  | { type: 'TELEMETRY_BATCH'; readings: Record<string, NodeTelemetry>; timestamp: string }
  | { type: 'NEW_ALERT'; alert: Alert }
  | { type: 'NEW_SMS'; sms: SMSLog }
  | { type: 'TRANSIENT_SPIKE'; nodeId: string; peakPressure: number; waveform: TransientDataPoint[] }
  | { type: 'SCENARIO_CHANGED'; scenario: SimulationControlState['currentScenario'] };

type EventListener = (event: SimulatorEvent) => void;

class PipelineSimulator {
  private listeners: Set<EventListener> = new Set();
  private timer: number | null = null;
  private scenarioState: SimulationControlState = {
    currentScenario: 'NORMAL',
  };

  // State trackers for gradual changes
  private scenarioStartTimestamp: number = 0;
  private leakSeverityProgress: number = 0; // 0.0 to 1.0

  // 100 Hz Transient waveform buffer for water hammer viewer
  private currentTransientWaveform: TransientDataPoint[] = [];

  constructor() {
    this.generateDefaultTransientWaveform(3.5, 7.42);
  }

  public subscribe(cb: EventListener): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private emit(event: SimulatorEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in simulator subscriber:', err);
      }
    });
  }

  public start() {
    if (this.timer) return;
    // Initial emit
    this.step();
    // 2-second telemetry cycle
    this.timer = window.setInterval(() => {
      this.step();
    }, 2000);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public getScenarioState(): SimulationControlState {
    return { ...this.scenarioState };
  }

  public getTransientWaveform(): TransientDataPoint[] {
    return [...this.currentTransientWaveform];
  }

  // Demo Control API
  public setScenario(scenario: SimulationControlState['currentScenario']) {
    this.scenarioState = {
      currentScenario: scenario,
      burstNodeId: scenario === 'BURST' ? 'NODE-14' : undefined,
      leakSegmentId: scenario === 'BURST' || scenario === 'LEAK_SMALL' ? 'SEG-14' : undefined,
      offlineNodeId: scenario === 'NODE_FAILURE' ? 'NODE-04' : undefined,
      simulatedTimeOverride: scenario === 'NIGHT_MNF_LEAK' ? '03:15 AM' : undefined,
    };
    this.scenarioStartTimestamp = Date.now();
    this.leakSeverityProgress = scenario === 'BURST' ? 1.0 : 0.0;

    if (scenario === 'WATER_HAMMER') {
      this.generateDefaultTransientWaveform(3.2, 7.85);
      this.emit({
        type: 'TRANSIENT_SPIKE',
        nodeId: 'NODE-02',
        peakPressure: 7.85,
        waveform: this.currentTransientWaveform,
      });

      // Emit Critical Alert for Water Hammer
      const hammerAlert: Alert = {
        id: `ALT-WH-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        nodeId: 'NODE-02',
        segmentId: 'SEG-01',
        severity: 'CRITICAL',
        type: 'Water Hammer',
        riskState: 'CRITICAL',
        status: 'New',
        confidencePct: 98,
        title: 'Severe Water Hammer Surge (7.85 Bar)',
        titleHi: 'गंभीर वाटर हैमर दबाव झटका (7.85 बार)',
        titleMr: 'तीव्र वॉटर हॅमर दाब झटका (७.८५ बार)',
        description: 'Instantaneous pressure peak exceeded 2.2x baseline following pump power fluctuation.',
        descriptionHi: 'पंप बिजली उतार-चढ़ाव के बाद दबाव शिखर बेसलाइन से 2.2 गुना अधिक दर्ज हुआ।',
        descriptionMr: 'पंप वीज खंडित झाल्यानंतर बेसलाइनपेक्षा २.२ पट जास्त तीव्र दाब झटका निर्माण झाला.',
        locationDescription: 'Pump House Rising Main Manifold',
        locationDescriptionHi: 'पंप हाउस मुख्य मैनिफोल्ड',
        locationDescriptionMr: 'पंप गृह मुख्य रायझिंग मेन',
        telemetrySnapshot: {
          pressureBar: 7.85,
          expectedPressureBar: 3.50,
          flowLpm: 38,
          expectedFlowLpm: 440,
          anomalyScore: 0.98,
        },
        detectedAt: new Date().toISOString(),
        timeToDetectSec: 1,
        assignedTo: 'Dattatray Shinde (District Eng)',
      };
      this.emit({ type: 'NEW_ALERT', alert: hammerAlert });

      const smsLog: SMSLog = {
        id: `SMS-${Date.now().toString().slice(-4)}`,
        alertId: hammerAlert.id,
        recipientRole: 'engineer',
        recipientName: 'Dattatray Shinde (District Eng)',
        phoneNumber: '+91 98900 12455',
        language: 'en',
        messageEn: `SmartNeer CRITICAL: Water Hammer Spike 7.85 bar detected at Node 02 (Pump House). Check NRV & surge vessel immediately.`,
        messageHi: `स्मार्ट-नीर गंभीर: नोड 02 (पंप हाउस) पर 7.85 बार का वाटर हैमर। तुरंत एनआरवी और सर्ज वेसल की जांच करें।`,
        messageMr: `स्मार्ट-नीर तातडीचा: नोड ०२ (पंप हाऊस) वर ७.८५ बारचा वॉटर हॅमर झटका. तातडीने एनआरव्ही व सर्ज वेसल तपासा.`,
        sentAt: new Date().toISOString(),
        deliveryStatus: 'Delivered',
        channel: 'SMS Gateway (Govt DLT)',
      };
      this.emit({ type: 'NEW_SMS', sms: smsLog });
    }

    if (scenario === 'BURST') {
      const burstAlert: Alert = {
        id: `ALT-BST-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        nodeId: 'NODE-14',
        segmentId: 'SEG-14',
        severity: 'CRITICAL',
        type: 'Burst',
        riskState: 'CRITICAL',
        status: 'New',
        confidencePct: 96,
        title: 'Catastrophic Pipe Burst at Node 14 (Ambedkar Nagar)',
        titleHi: 'नोड 14 (आंबेडकर नगर) पर भारी पाइप फटने का अलर्ट',
        titleMr: 'नोड १४ (आंबेडकर नगर) मुख्य जलवाहिनी फुटल्याचा (Burst) गंभीर इशारा',
        description: 'Instantaneous pressure collapse to 0.18 bar with upstream flow surge. Estimated leak on segment SEG-14.',
        descriptionHi: 'दबाव घटकर 0.18 बार रह गया और प्रवाह में भारी वृद्धि हुई। सेगमेंट SEG-14 पर लीकेज।',
        descriptionMr: 'दाब कोसळून ०.१८ बारवर आला आणि पाण्याचा अपव्यय वेगाने सुरू झाला. सेगमेंट SEG-14 वर गळती.',
        locationDescription: 'Ambedkar Nagar Main Road - Culvert Bridge (Segment SEG-14)',
        locationDescriptionHi: 'आंबेडकर नगर मुख्य सड़क - पुलिया क्रॉसिंग (सेगमेंट SEG-14)',
        locationDescriptionMr: 'आंबेडकर नगर मुख्य रस्ता - साकव पूल (सेगमेंट SEG-14)',
        telemetrySnapshot: {
          pressureBar: 0.18,
          expectedPressureBar: 2.00,
          flowLpm: 195,
          expectedFlowLpm: 110,
          anomalyScore: 0.97,
        },
        detectedAt: new Date().toISOString(),
        timeToDetectSec: 2,
        assignedTo: 'Suresh Patil (Gram Panchayat Fitter)',
      };
      this.emit({ type: 'NEW_ALERT', alert: burstAlert });

      const smsLog: SMSLog = {
        id: `SMS-${Date.now().toString().slice(-4)}`,
        alertId: burstAlert.id,
        recipientRole: 'operator',
        recipientName: 'Suresh Patil (Operator)',
        phoneNumber: '+91 98224 51102',
        language: 'mr',
        messageEn: `SmartNeer CRITICAL: Pipe Burst detected at Node 14 (Ambedkar Nagar Culvert). Pressure 0.18 bar. Close sluice valve SV-04 immediately!`,
        messageHi: `स्मार्ट-नीर गंभीर: नोड 14 (आंबेडकर नगर) पर पाइप फटा। दबाव 0.18 बार। तुरंत स्लुइस वाल्व SV-04 बंद करें!`,
        messageMr: `स्मार्ट-नीर तातडीचा इशारा: नोड १४ (आंबेडकर नगर साकव) वर मुख्य पाईप फुटला! दाब ०.१८ बार. व्हॉल्व SV-04 त्वरित बंद करा!`,
        sentAt: new Date().toISOString(),
        deliveryStatus: 'Delivered',
        channel: 'SMS Gateway (Govt DLT)',
      };
      this.emit({ type: 'NEW_SMS', sms: smsLog });
    }

    if (scenario === 'CONTAMINATION') {
      const contamAlert: Alert = {
        id: `ALT-WQ-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        nodeId: 'NODE-15',
        segmentId: 'SEG-15',
        severity: 'CRITICAL',
        type: 'Contamination Ingress',
        riskState: 'CRITICAL',
        status: 'New',
        confidencePct: 91,
        title: 'Severe Contamination / Back-Siphonage Ingress',
        titleHi: 'गंभीर संदूषण / बैक-साइफन जल प्रदूषण का पता चला',
        titleMr: 'तीव्र दूषितीकरण / बॅक-सायफनेज पाणी प्रदूषण धोका',
        description: 'TDS increased by 54% (680 ppm) with VOC spike to 420 ppb following negative pipeline suction.',
        descriptionHi: 'पाइपलाइन वैक्यूम के बाद टीडीएस 54% (680 पीपीएम) और वीओसी 420 पीपीबी तक बढ़ गया।',
        descriptionMr: 'जलवाहिनीत पोकळी निर्माण झाल्यामुळे टीडीएस ५४% (६८० पीपीएम) आणि व्हीओसी ४२० पीपीबीवर उसळले.',
        locationDescription: 'Samata Nagar Crossline - Near Filter Plant',
        locationDescriptionHi: 'समता नगर क्रॉसलाइन - आरओ प्लांट के पास',
        locationDescriptionMr: 'समता नगर क्रॉसलाइन - आरओ फिल्टर जवळ',
        telemetrySnapshot: {
          pressureBar: 1.45,
          expectedPressureBar: 1.60,
          flowLpm: 68,
          expectedFlowLpm: 70,
          anomalyScore: 0.94,
        },
        detectedAt: new Date().toISOString(),
        timeToDetectSec: 6,
        assignedTo: 'Ramesh Jadhav (VWSC Operator)',
      };
      this.emit({ type: 'NEW_ALERT', alert: contamAlert });

      const smsLog: SMSLog = {
        id: `SMS-${Date.now().toString().slice(-4)}`,
        alertId: contamAlert.id,
        recipientRole: 'sarpanch',
        recipientName: 'Kailasrao More (Sarpanch)',
        phoneNumber: '+91 94222 10988',
        language: 'mr',
        messageEn: `SmartNeer Health Alert: High TDS (680 ppm) & VOC spike at Node 15 (Samata Nagar). Issue public advisory not to consume drinking water until flushed.`,
        messageHi: `स्मार्ट-नीर स्वास्थ्य अलर्ट: नोड 15 (समता नगर) पर उच्च टीडीएस (680 ppm)। नागरिकों को पानी न पीने की सूचना दें।`,
        messageMr: `स्मार्ट-नीर आरोग्य इशारा: नोड १५ (समता नगर) येथे टीडीएस ६८० ppm व प्रदूषण. लाईन स्वच्छ होईपर्यंत पाणी पिऊ नये अशी दवंडी द्या.`,
        sentAt: new Date().toISOString(),
        deliveryStatus: 'Delivered',
        channel: 'WhatsApp Business API',
      };
      this.emit({ type: 'NEW_SMS', sms: smsLog });
    }

    if (scenario === 'NIGHT_MNF_LEAK') {
      const mnfAlert: Alert = {
        id: `ALT-MNF-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        nodeId: 'NODE-10',
        segmentId: 'SEG-09',
        severity: 'WARNING',
        type: 'Unauthorized Tapping',
        riskState: 'WARNING',
        status: 'New',
        confidencePct: 88,
        title: 'Minimum Night Flow (MNF) Threshold Breach',
        titleHi: 'न्यूनतम रात्रि प्रवाह (MNF) सीमा का उल्लंघन',
        titleMr: 'किमान रात्री प्रवाह (MNF) मर्यादा उल्लंघन (अनधिकृत उपसा)',
        description: 'Simulated 03:15 AM check: Sustained flow of 34 L/min during zero-demand window. Suspected illegal commercial connection.',
        descriptionHi: 'रात्रि 03:15 बजे शून्य-मांग समय में 34 ली/मि का प्रवाह। अवैध व्यावसायिक कनेक्शन का संदेह।',
        descriptionMr: 'पहाटे ०३:१५ वाजता मागणी नसताना ३४ ली/मि प्रवाह सुरू आढळला. बेकायदेशीर व्यावसायिक जोडणीचा संशय.',
        locationDescription: 'ZP High School Compound Junction',
        locationDescriptionHi: 'जिला परिषद स्कूल कंपाउंड',
        locationDescriptionMr: 'जि.प. शाळा आवार परिसर',
        telemetrySnapshot: {
          pressureBar: 0.52,
          expectedPressureBar: 0.02,
          flowLpm: 34,
          expectedFlowLpm: 0,
          anomalyScore: 0.85,
        },
        detectedAt: new Date().toISOString(),
        timeToDetectSec: 45,
        assignedTo: 'Suresh Patil (Gram Panchayat Fitter)',
      };
      this.emit({ type: 'NEW_ALERT', alert: mnfAlert });
    }

    if (scenario === 'NODE_FAILURE') {
      const failAlert: Alert = {
        id: `ALT-NFL-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        nodeId: 'NODE-04',
        severity: 'WARNING',
        type: 'Node Disconnected',
        riskState: 'OFFLINE',
        status: 'New',
        confidencePct: 99,
        title: 'Router Node 04 Lost Heartbeat – Mesh Re-routed',
        titleHi: 'राउटर नोड 04 ऑफलाइन – मेश नेटवर्क स्वचालित पुनः रूट हुआ',
        titleMr: 'राऊटर नोड ०४ संपर्क तुटला – मेश नेटवर्कने पर्यायी मार्ग निवडला',
        description: 'Battery dip or RF shadow caused Node 04 disconnect. Leaf nodes 05, 06, 07 dynamically re-routed through Node 08.',
        descriptionHi: 'नोड 04 डिस्कनेक्ट हुआ। लीफ नोड्स ने नोड 08 के माध्यम से डेटा भेजना शुरू किया।',
        descriptionMr: 'नोड ०४ चा संपर्क तुटल्याने नोड्स ०५, ०६, ०७ यांनी नोड ०८ मार्गे डेटा पाठवणे सुरू केले.',
        locationDescription: 'North Feeder Sluice Chamber',
        locationDescriptionHi: 'उत्तर फीडर वाल्व चैंबर',
        locationDescriptionMr: 'उत्तर शाखा चेंबर',
        telemetrySnapshot: {
          pressureBar: 0,
          expectedPressureBar: 2.6,
          flowLpm: 0,
          expectedFlowLpm: 180,
          anomalyScore: 0.70,
        },
        detectedAt: new Date().toISOString(),
        timeToDetectSec: 5,
        assignedTo: 'Ramesh Jadhav (VWSC Operator)',
      };
      this.emit({ type: 'NEW_ALERT', alert: failAlert });
    }

    this.emit({ type: 'SCENARIO_CHANGED', scenario });
  }

  // Periodic step executing every 2 seconds
  public step() {
    const now = new Date();
    const isSupplyOn = this.scenarioState.currentScenario === 'NIGHT_MNF_LEAK' ? false : isWaterSupplyScheduled(now);
    const readings: Record<string, NodeTelemetry> = {};

    // Progress gradual leak if in LEAK_SMALL scenario
    if (this.scenarioState.currentScenario === 'LEAK_SMALL') {
      const elapsedSec = (Date.now() - this.scenarioStartTimestamp) / 1000;
      this.leakSeverityProgress = Math.min(1.0, elapsedSec / 12.0); // Full leak in 12s

      if (elapsedSec >= 10 && elapsedSec <= 12) {
        // Emit alert when threshold reached
        const leakAlert: Alert = {
          id: `ALT-LK-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString(),
          nodeId: 'NODE-14',
          segmentId: 'SEG-14',
          severity: 'WARNING',
          type: 'Background Leak',
          riskState: 'WARNING',
          status: 'New',
          confidencePct: 84,
          title: 'Developing Leak Detected on Segment SEG-14',
          titleHi: 'सेगमेंट SEG-14 पर विकसित हो रहे रिसाव का पता चला',
          titleMr: 'सेगमेंट SEG-14 वर वाढती गळती आढळली (इशारा)',
          description: 'Hazen-Williams residual dropped 0.48 bar below model. Acoustic vibration elevated by 0.35g.',
          descriptionHi: 'दबाव मॉडल से 0.48 बार कम हुआ। कंपन 0.35g बढ़ा।',
          descriptionMr: 'मॉडेलपेक्षा ०.४८ बार दाब घटला आणि कंपने ०.३५g ने वाढली.',
          locationDescription: 'Main Road Pipeline Branch (Between Node 13 & 14)',
          locationDescriptionHi: 'मुख्य सड़क पाइपलाइन शाखा (नोड 13 और 14 के बीच)',
          locationDescriptionMr: 'मुख्य रस्ता पाईप शाखा (नोड १३ व १४ दरम्यान)',
          telemetrySnapshot: {
            pressureBar: 1.48,
            expectedPressureBar: 2.00,
            flowLpm: 138,
            expectedFlowLpm: 110,
            anomalyScore: 0.77,
          },
          detectedAt: new Date().toISOString(),
          timeToDetectSec: 10,
          assignedTo: 'Suresh Patil (Gram Panchayat Fitter)',
        };
        this.emit({ type: 'NEW_ALERT', alert: leakAlert });
      }
    }

    // Generate telemetry for each node
    for (const node of INITIAL_NODES) {
      const epanet = getEpanetExpectedValues(node.id, now);

      // Jitter & noise
      const noise = (Math.random() - 0.5) * 0.08;
      const flowNoise = (Math.random() - 0.5) * 3;

      let pressure = isSupplyOn
        ? epanet.expectedPressureBar + noise
        : Math.max(0.01, epanet.expectedPressureBar + (Math.random() - 0.5) * 0.02);
      let flow = isSupplyOn
        ? Math.max(0, epanet.expectedFlowLpm + flowNoise)
        : Math.max(0, (Math.random() - 0.5) * 0.5);

      let tds = 310 + Math.sin(Date.now() / 15000 + node.location.lat * 10) * 15 + (Math.random() - 0.5) * 5;
      let ec = tds * 1.56;
      let voc = 18 + Math.random() * 6;
      let vibration = 0.04 + Math.random() * 0.03;
      let anomalyScore = 0.08 + Math.random() * 0.08;
      let riskState: RiskState = 'NORMAL';
      let eventType: EventType = 'Normal Flow';
      const flags: string[] = [];

      // Check scenario overrides
      if (this.scenarioState.currentScenario === 'BURST' && (node.id === 'NODE-14' || node.id === 'NODE-15')) {
        if (node.id === 'NODE-14') {
          // Severe collapse at burst node
          pressure = 0.18 + Math.random() * 0.04;
          flow = epanet.expectedFlowLpm * 1.75; // Water gushing out
          vibration = 0.82 + Math.random() * 0.15; // Acoustic roar of burst
          anomalyScore = 0.98;
          riskState = 'CRITICAL';
          eventType = 'Burst';
          flags.push('EPANET residual -1.82 bar', 'Acoustic pipe roar > 0.8g', 'Upstream mass flow surge');
        } else if (node.id === 'NODE-15') {
          // Downstream starvation
          pressure = 0.22 + Math.random() * 0.05;
          flow = 12 + Math.random() * 4; // Downstream lost pressure
          anomalyScore = 0.86;
          riskState = 'CRITICAL';
          eventType = 'Burst';
          flags.push('Severe downstream starvation', 'Pressure loss propagation');
        }
      } else if (this.scenarioState.currentScenario === 'LEAK_SMALL' && node.id === 'NODE-14') {
        const drop = this.leakSeverityProgress * 0.55;
        pressure = Math.max(0.5, epanet.expectedPressureBar - drop + noise);
        flow = epanet.expectedFlowLpm + this.leakSeverityProgress * 28 + flowNoise;
        vibration = 0.04 + this.leakSeverityProgress * 0.32;
        anomalyScore = 0.2 + this.leakSeverityProgress * 0.58;
        if (this.leakSeverityProgress > 0.5) {
          riskState = 'WARNING';
          eventType = 'Background Leak';
          flags.push('Developing leak signature', 'Pressure gradient deviation');
        }
      } else if (this.scenarioState.currentScenario === 'WATER_HAMMER' && node.id === 'NODE-02') {
        // High transient pressure peak decay
        pressure = 5.2 + Math.random() * 0.4;
        vibration = 0.65 + Math.random() * 0.12;
        anomalyScore = 0.94;
        riskState = 'CRITICAL';
        eventType = 'Water Hammer';
        flags.push('Shockwave pressure envelope > 2x baseline', 'Impulse vibration trip');
      } else if (this.scenarioState.currentScenario === 'CONTAMINATION' && (node.id === 'NODE-15' || node.id === 'NODE-14')) {
        tds = 640 + Math.random() * 60;
        ec = tds * 1.62;
        voc = 380 + Math.random() * 50;
        anomalyScore = 0.92;
        riskState = 'CRITICAL';
        eventType = 'Contamination Ingress';
        flags.push('TDS spike +54% vs baseline', 'VOC chemical ingress detected', 'Possible back-siphonage suction');
      } else if (this.scenarioState.currentScenario === 'NIGHT_MNF_LEAK' && (node.id === 'NODE-10' || node.id === 'NODE-09')) {
        // MNF: Outside supply hours, but high flow!
        pressure = 0.48 + Math.random() * 0.05;
        flow = 32 + Math.random() * 5;
        anomalyScore = 0.84;
        riskState = 'WARNING';
        eventType = 'Unauthorized Tapping';
        flags.push('MNF breach: Flow > 5 L/min between 01:00-04:00', 'Illegal tapping suspected');
      } else if (this.scenarioState.currentScenario === 'NODE_FAILURE' && node.id === 'NODE-04') {
        riskState = 'OFFLINE';
        eventType = 'Node Disconnected';
        pressure = 0;
        flow = 0;
        anomalyScore = 0.65;
        flags.push('Mesh packet timeout > 60s', 'Offline heartbeat loss');
      } else if (node.id === 'NODE-06') {
        // Default historical small warning on Node 6
        pressure = isSupplyOn ? epanet.expectedPressureBar - 0.30 + noise : 0.05;
        flow = isSupplyOn ? epanet.expectedFlowLpm + 10 + flowNoise : 0;
        anomalyScore = 0.68;
        riskState = 'WARNING';
        eventType = 'Background Leak';
        flags.push('Minor pressure gradient shift (-0.32 bar)', 'Pinhole joint acoustic frequency');
      }

      readings[node.id] = {
        nodeId: node.id,
        timestamp: new Date().toISOString(),
        pressureBar: Number(pressure.toFixed(2)),
        flowLpm: Number(flow.toFixed(1)),
        tdsPpm: Math.round(tds),
        ecUsCm: Math.round(ec),
        vocIndexPpb: Math.round(voc),
        vibrationG: Number(vibration.toFixed(3)),
        batteryPct: node.batteryPct,
        rssiDb: node.rssiDb,
        epanetExpectedPressureBar: Number(epanet.expectedPressureBar.toFixed(2)),
        epanetExpectedFlowLpm: Number(epanet.expectedFlowLpm.toFixed(1)),
        anomalyScore: Number(anomalyScore.toFixed(2)),
        riskState,
        eventType,
        flags,
      };
    }

    this.emit({
      type: 'TELEMETRY_BATCH',
      readings,
      timestamp: new Date().toISOString(),
    });
  }

  // Generates 1000 points (100 Hz for 10 seconds) for Water Hammer waveform viewer
  private generateDefaultTransientWaveform(baseline: number, peak: number) {
    const points: TransientDataPoint[] = [];
    const totalPoints = 1000;
    const peakIndex = 180; // Peak occurs at 1.8 seconds

    for (let i = 0; i < totalPoints; i++) {
      const tSec = i / 100.0;
      let pressure = baseline;

      if (i < peakIndex) {
        // Steady baseline with small pre-trip vibration
        pressure = baseline + (Math.random() - 0.5) * 0.05;
      } else {
        // Surge event: Damped oscillatory shockwave (decaying sine wave)
        const tSurge = (i - peakIndex) / 100.0;
        const decayRate = 1.1; // exponential decay
        const waveFreq = 3.5; // 3.5 Hz primary water column oscillation
        const amplitude = (peak - baseline) * Math.exp(-decayRate * tSurge);
        const oscillation = amplitude * Math.cos(2 * Math.PI * waveFreq * tSurge);
        pressure = baseline + oscillation + (Math.random() - 0.5) * 0.08;
      }

      points.push({
        timeOffsetMs: i * 10,
        pressureBar: Number(Math.max(0.1, pressure).toFixed(2)),
        isPeak: i === peakIndex,
      });
    }

    this.currentTransientWaveform = points;
  }
}

// Global Singleton Simulator (acts as WebSocket / MQTT Client bridge)
export const simulator = new PipelineSimulator();
