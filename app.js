const scenarios = {
  healthcare: {
    label: "Healthcare capacity",
    code: "HC-204",
    owner: "Chief Operating Officer",
    horizon: "2 quarters",
    exposure: "$4.8M access gap",
    brief:
      "A regional clinic network is seeing rising demand, longer appointment wait times, and uneven staffing utilization across sites.",
    decision: "Expand clinical capacity with phased staffing and scheduling redesign",
    baseRevenue: 5.4,
    baseCost: 2.1,
    factor: { value: 1.04, risk: 1.12, impact: 1.18 },
    actions: [
      ["Weeks 1-3", "Validate site-level demand, wait-time leakage, and staffing variance."],
      ["Weeks 4-8", "Pilot schedule redesign in two clinics with clear escalation thresholds."],
      ["Weeks 9-12", "Scale capacity where access, quality, and utilization indicators improve."],
    ],
  },
  retail: {
    label: "Retail inventory",
    code: "RT-118",
    owner: "VP Merchandising",
    horizon: "Seasonal cycle",
    exposure: "$3.2M margin swing",
    brief:
      "A retailer must decide how aggressively to stock seasonal products while protecting margin, availability, and working capital.",
    decision: "Rebalance inventory toward high-confidence demand segments",
    baseRevenue: 4.6,
    baseCost: 1.8,
    factor: { value: 1.12, risk: 1.04, impact: 0.98 },
    actions: [
      ["Weeks 1-3", "Segment SKUs by demand confidence, margin, and stockout penalty."],
      ["Weeks 4-8", "Shift open-to-buy toward resilient segments and cap long-tail exposure."],
      ["Weeks 9-12", "Review sell-through weekly and rebalance inventory before markdown risk rises."],
    ],
  },
  education: {
    label: "Student enrollment",
    code: "ED-307",
    owner: "Provost Office",
    horizon: "Academic year",
    exposure: "$6.1M tuition risk",
    brief:
      "A university wants to improve enrollment yield and persistence through advising, outreach, and scholarship allocation.",
    decision: "Target advising and aid toward at-risk enrollment cohorts",
    baseRevenue: 6.8,
    baseCost: 2.6,
    factor: { value: 0.96, risk: 0.92, impact: 1.2 },
    actions: [
      ["Weeks 1-3", "Identify cohorts with the largest yield and persistence sensitivity."],
      ["Weeks 4-8", "Launch advising interventions with measured student response signals."],
      ["Weeks 9-12", "Redirect aid and staff effort toward cohorts with confirmed lift."],
    ],
  },
  finance: {
    label: "Fraud response",
    code: "FN-512",
    owner: "Chief Risk Officer",
    horizon: "90 days",
    exposure: "$2.7M loss exposure",
    brief:
      "A financial services team must tune fraud controls across approval speed, loss prevention, false positives, and customer trust.",
    decision: "Increase adaptive controls for medium-risk transactions",
    baseRevenue: 3.9,
    baseCost: 1.5,
    factor: { value: 1.08, risk: 1.2, impact: 0.94 },
    actions: [
      ["Weeks 1-3", "Audit false positives, fraud loss clusters, and approval latency."],
      ["Weeks 4-8", "Deploy adaptive controls to medium-risk bands with override monitoring."],
      ["Weeks 9-12", "Tune thresholds using loss reduction and customer friction evidence."],
    ],
  },
  supply: {
    label: "Supply chain resilience",
    code: "SC-276",
    owner: "Head of Supply Chain",
    horizon: "2 quarters",
    exposure: "$7.4M disruption risk",
    brief:
      "An operations team must decide how much redundancy to fund across suppliers, inventory buffers, logistics, and service levels.",
    decision: "Fund resilience buffers for the most fragile supply nodes",
    baseRevenue: 7.2,
    baseCost: 2.9,
    factor: { value: 1.01, risk: 1.08, impact: 1.1 },
    actions: [
      ["Weeks 1-3", "Rank suppliers and lanes by revenue dependency and recovery time."],
      ["Weeks 4-8", "Contract backup capacity for the most fragile high-value nodes."],
      ["Weeks 9-12", "Stress-test service levels and tune buffer inventory by segment."],
    ],
  },
};

const controls = ["budget", "demand", "operations", "risk"];

const elements = Object.fromEntries(
  [
    "scenarioSelect",
    "scenarioBrief",
    "caseCode",
    "decisionOwner",
    "planningHorizon",
    "baselineExposure",
    "valueScore",
    "riskScore",
    "impactScore",
    "confidenceScore",
    "valueDetail",
    "riskDetail",
    "impactDetail",
    "confidenceDetail",
    "recommendationTitle",
    "recommendationText",
    "decisionStage",
    "governanceLevel",
    "decisionBrief",
    "decisionDot",
    "copyButton",
    "resetButton",
    "riskBadge",
    "riskDrivers",
    "sensitivityList",
    "actionPlan",
    "actionCadence",
    ...controls,
    ...controls.map((name) => `${name}Value`),
  ].map((id) => [id, document.getElementById(id)]),
);

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function currency(value) {
  const prefix = value < 0 ? "-$" : "$";
  return `${prefix}${Math.abs(value).toFixed(1)}M`;
}

function getInputs() {
  return Object.fromEntries(controls.map((name) => [name, Number(elements[name].value)]));
}

function score(inputs, scenario) {
  const factor = scenario.factor;
  const value = clamp(
    (inputs.budget * 0.3 + inputs.demand * 0.2 + inputs.operations * 0.4 + inputs.risk * 0.1) *
      factor.value,
  );
  const executionRisk = clamp(
    (inputs.demand * 0.34 + inputs.risk * 0.31 + (100 - inputs.operations) * 0.27 + inputs.budget * 0.08) *
      factor.risk,
  );
  const impact = clamp(
    (inputs.operations * 0.34 + inputs.budget * 0.25 + inputs.demand * 0.2 + (100 - inputs.risk) * 0.21) *
      factor.impact,
  );
  const confidence = clamp(value * 0.36 + impact * 0.34 + (100 - executionRisk) * 0.3);
  const netValue = (scenario.baseRevenue * value) / 100 - (scenario.baseCost * inputs.budget) / 100;
  const riskExposure = (scenario.baseRevenue * executionRisk) / 100;
  const serviceLift = Math.round((impact - 50) * 0.42);

  return { value, executionRisk, impact, confidence, netValue, riskExposure, serviceLift };
}

function classify(scores) {
  if (scores.confidence >= 76 && scores.executionRisk <= 45) {
    return {
      title: "Scale with executive sponsorship",
      stage: "Scale decision",
      governance: "Monthly steering review",
      text:
        "The upside is strong and execution risk is contained. Move beyond analysis, appoint a decision owner, and scale with explicit leading indicators.",
    };
  }
  if (scores.value >= 66 && scores.executionRisk > 55) {
    return {
      title: "Pilot with hard guardrails",
      stage: "Controlled pilot",
      governance: "Weekly risk review",
      text:
        "The opportunity is meaningful, but the model shows material delivery risk. Pilot in a narrow operating slice, cap downside exposure, and require evidence before expansion.",
    };
  }
  if (scores.impact >= 70 && scores.confidence < 66) {
    return {
      title: "Strengthen evidence before funding",
      stage: "Evidence build",
      governance: "Assumption review",
      text:
        "Stakeholder impact is high, but confidence is not yet strong enough for full commitment. Improve the evidence base around adoption, capacity, and constraints.",
    };
  }
  return {
    title: "Hold, monitor, and refine",
    stage: "Monitor",
    governance: "Biweekly signal review",
    text:
      "The current assumptions do not justify a major move. Refine the decision objective, improve readiness, and watch the signals most likely to change the tradeoff.",
  };
}

function riskDrivers(inputs, scores) {
  return [
    {
      label: "Demand volatility",
      detail: "Pressure created by uncertain volume, timing, or adoption.",
      value: clamp(inputs.demand * 0.72 + (100 - inputs.operations) * 0.28),
    },
    {
      label: "Operating constraint",
      detail: "Readiness gap across staffing, process, data quality, or execution capacity.",
      value: clamp((100 - inputs.operations) * 0.82 + inputs.budget * 0.18),
    },
    {
      label: "Downside exposure",
      detail: "Risk accepted by leadership relative to the size of the commitment.",
      value: clamp(inputs.risk * 0.68 + scores.executionRisk * 0.32),
    },
  ].sort((a, b) => b.value - a.value);
}

function sensitivity(inputs, scenario) {
  const base = score(inputs, scenario).confidence;
  return controls
    .map((name) => {
      const changed = { ...inputs, [name]: clamp(inputs[name] + 10) };
      return {
        label:
          name === "budget"
            ? "Investment level"
            : name === "demand"
              ? "Demand pressure"
              : name === "operations"
                ? "Operational readiness"
                : "Risk tolerance",
        delta: score(changed, scenario).confidence - base,
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

function renderRiskDrivers(drivers) {
  elements.riskDrivers.innerHTML = drivers
    .map(
      (driver) => `
        <div class="driver-item">
          <strong>${driver.label}</strong>
          <span class="driver-score">${driver.value}</span>
          <small>${driver.detail}</small>
        </div>
      `,
    )
    .join("");
}

function renderSensitivity(items) {
  const maxDelta = Math.max(...items.map((item) => Math.abs(item.delta)), 1);
  elements.sensitivityList.innerHTML = items
    .map((item) => {
      const width = Math.max(8, (Math.abs(item.delta) / maxDelta) * 100);
      const sign = item.delta >= 0 ? "+" : "";
      return `
        <div class="sensitivity-item">
          <strong>${item.label}</strong>
          <span>${sign}${item.delta} confidence pts</span>
          <div class="bar-track"><div class="bar-fill" style="width: ${width}%"></div></div>
        </div>
      `;
    })
    .join("");
}

function renderActionPlan(scenario) {
  elements.actionPlan.innerHTML = scenario.actions
    .map(
      ([period, text]) => `
        <div class="action-item">
          <strong>${period}</strong>
          <p>${text}</p>
        </div>
      `,
    )
    .join("");
}

function update() {
  const scenario = scenarios[elements.scenarioSelect.value];
  const inputs = getInputs();
  const scores = score(inputs, scenario);
  const recommendation = classify(scores);
  const drivers = riskDrivers(inputs, scores);
  const sensitivityItems = sensitivity(inputs, scenario);

  controls.forEach((name) => {
    elements[`${name}Value`].textContent = `${inputs[name]}%`;
  });

  elements.caseCode.textContent = scenario.code;
  elements.scenarioBrief.textContent = scenario.brief;
  elements.decisionOwner.textContent = scenario.owner;
  elements.planningHorizon.textContent = scenario.horizon;
  elements.baselineExposure.textContent = scenario.exposure;

  elements.valueScore.textContent = currency(scores.netValue);
  elements.riskScore.textContent = `${scores.executionRisk}/100`;
  elements.impactScore.textContent = `${scores.serviceLift >= 0 ? "+" : ""}${scores.serviceLift}%`;
  elements.confidenceScore.textContent = `${scores.confidence}/100`;
  elements.valueDetail.textContent = `${scores.value}/100 opportunity score`;
  elements.riskDetail.textContent = `${currency(scores.riskExposure)} estimated exposure`;
  elements.impactDetail.textContent = `${scores.impact}/100 stakeholder score`;
  elements.confidenceDetail.textContent = "Weighted confidence index";

  elements.recommendationTitle.textContent = recommendation.title;
  elements.recommendationText.textContent = recommendation.text;
  elements.decisionStage.textContent = recommendation.stage;
  elements.governanceLevel.textContent = recommendation.governance;

  elements.decisionDot.style.left = `${clamp(scores.value, 8, 92)}%`;
  elements.decisionDot.style.top = `${clamp(100 - scores.executionRisk, 8, 92)}%`;
  elements.riskBadge.textContent = drivers[0].value >= 70 ? "Elevated" : drivers[0].value >= 50 ? "Moderate" : "Contained";
  elements.actionCadence.textContent = scenario.horizon;

  renderRiskDrivers(drivers);
  renderSensitivity(sensitivityItems);
  renderActionPlan(scenario);

  elements.decisionBrief.textContent = [
    `Scenario: ${scenario.label} (${scenario.code})`,
    `Decision owner: ${scenario.owner}`,
    `Strategic decision: ${scenario.decision}`,
    `Planning horizon: ${scenario.horizon}`,
    `Assumptions: investment ${inputs.budget}%, demand pressure ${inputs.demand}%, readiness ${inputs.operations}%, risk tolerance ${inputs.risk}%`,
    `Projected impact: net value ${currency(scores.netValue)}, risk exposure ${currency(scores.riskExposure)}, service impact ${scores.serviceLift >= 0 ? "+" : ""}${scores.serviceLift}%, confidence ${scores.confidence}/100`,
    `Recommendation: ${recommendation.title}`,
    `Governance: ${recommendation.governance}`,
    `Primary risk driver: ${drivers[0].label} (${drivers[0].value}/100)`,
    `Rationale: ${recommendation.text}`,
  ].join("\n");
}

function reset() {
  elements.scenarioSelect.value = "healthcare";
  elements.budget.value = 55;
  elements.demand.value = 62;
  elements.operations.value = 58;
  elements.risk.value = 48;
  update();
}

controls.forEach((name) => elements[name].addEventListener("input", update));
elements.scenarioSelect.addEventListener("change", update);
elements.resetButton.addEventListener("click", reset);
elements.copyButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(elements.decisionBrief.textContent);
  elements.copyButton.textContent = "Copied";
  setTimeout(() => {
    elements.copyButton.textContent = "Copy brief";
  }, 1200);
});

update();
