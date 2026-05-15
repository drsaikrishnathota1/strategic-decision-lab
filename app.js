const scenarios = {
  healthcare: {
    label: "Healthcare capacity",
    brief:
      "Balance staffing, patient demand, quality of care, and operating cost for a regional clinic network.",
    decision: "Expand clinical capacity with phased staffing",
    factor: { value: 1.03, risk: 1.12, impact: 1.18 },
  },
  retail: {
    label: "Retail inventory",
    brief:
      "Choose how aggressively to stock seasonal products while protecting margin and customer availability.",
    decision: "Rebalance inventory toward high-confidence demand segments",
    factor: { value: 1.12, risk: 1.04, impact: 0.98 },
  },
  education: {
    label: "Student enrollment",
    brief:
      "Allocate outreach, advising, and scholarship dollars to improve persistence and enrollment yield.",
    decision: "Target advising and aid toward at-risk enrollment cohorts",
    factor: { value: 0.96, risk: 0.92, impact: 1.2 },
  },
  finance: {
    label: "Fraud response",
    brief:
      "Tune fraud controls across approval speed, loss prevention, false positives, and customer trust.",
    decision: "Increase adaptive controls for medium-risk transactions",
    factor: { value: 1.08, risk: 1.2, impact: 0.94 },
  },
  supply: {
    label: "Supply chain resilience",
    brief:
      "Decide how much redundancy to fund across suppliers, inventory buffers, logistics, and service levels.",
    decision: "Fund resilience buffers for the most fragile supply nodes",
    factor: { value: 1.01, risk: 1.08, impact: 1.1 },
  },
};

const controls = ["budget", "demand", "operations", "risk"];

const elements = Object.fromEntries(
  [
    "scenarioSelect",
    "scenarioBrief",
    "valueScore",
    "riskScore",
    "impactScore",
    "confidenceScore",
    "valueMeter",
    "riskMeter",
    "impactMeter",
    "confidenceMeter",
    "recommendationTitle",
    "recommendationText",
    "decisionBrief",
    "decisionDot",
    "copyButton",
    "resetButton",
    ...controls,
    ...controls.map((name) => `${name}Value`),
  ].map((id) => [id, document.getElementById(id)]),
);

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function score(inputs, factor) {
  const value = clamp(
    (inputs.budget * 0.32 + inputs.demand * 0.22 + inputs.operations * 0.38 + inputs.risk * 0.08) *
      factor.value,
  );
  const executionRisk = clamp(
    (inputs.demand * 0.35 + inputs.risk * 0.32 + (100 - inputs.operations) * 0.26 + inputs.budget * 0.07) *
      factor.risk,
  );
  const impact = clamp(
    (inputs.operations * 0.34 + inputs.budget * 0.26 + inputs.demand * 0.2 + (100 - inputs.risk) * 0.2) *
      factor.impact,
  );
  const confidence = clamp(value * 0.36 + impact * 0.34 + (100 - executionRisk) * 0.3);

  return { value, executionRisk, impact, confidence };
}

function classify(scores) {
  if (scores.confidence >= 75 && scores.executionRisk <= 45) {
    return {
      title: "Scale the decision",
      text:
        "The model shows strong upside with manageable execution risk. Move from analysis to a controlled rollout, define decision owners, and track leading indicators weekly.",
    };
  }
  if (scores.value >= 65 && scores.executionRisk > 55) {
    return {
      title: "Run a constrained pilot",
      text:
        "The upside is attractive, but uncertainty is still material. Pilot with guardrails, cap downside exposure, and revisit assumptions after the first operating cycle.",
    };
  }
  if (scores.impact >= 70 && scores.confidence < 65) {
    return {
      title: "Improve evidence quality",
      text:
        "Stakeholder impact is high, so the decision deserves better evidence before full commitment. Add data on constraints, adoption risk, and operational bottlenecks.",
    };
  }
  return {
    title: "Monitor and refine",
    text:
      "The current conditions do not justify a large move. Clarify the decision objective, improve readiness, and watch for demand or cost signals that change the tradeoff.",
  };
}

function getInputs() {
  return Object.fromEntries(controls.map((name) => [name, Number(elements[name].value)]));
}

function update() {
  const scenario = scenarios[elements.scenarioSelect.value];
  const inputs = getInputs();
  const scores = score(inputs, scenario.factor);
  const recommendation = classify(scores);

  controls.forEach((name) => {
    elements[`${name}Value`].textContent = `${inputs[name]}%`;
  });

  elements.scenarioBrief.textContent = scenario.brief;
  elements.valueScore.textContent = `${scores.value}`;
  elements.riskScore.textContent = `${scores.executionRisk}`;
  elements.impactScore.textContent = `${scores.impact}`;
  elements.confidenceScore.textContent = `${scores.confidence}`;
  elements.valueMeter.value = scores.value;
  elements.riskMeter.value = scores.executionRisk;
  elements.impactMeter.value = scores.impact;
  elements.confidenceMeter.value = scores.confidence;
  elements.recommendationTitle.textContent = recommendation.title;
  elements.recommendationText.textContent = recommendation.text;

  elements.decisionDot.style.left = `${clamp(scores.value, 8, 92)}%`;
  elements.decisionDot.style.top = `${clamp(100 - scores.executionRisk, 8, 92)}%`;

  elements.decisionBrief.textContent = [
    `Scenario: ${scenario.label}`,
    `Strategic decision: ${scenario.decision}`,
    `Inputs: budget ${inputs.budget}%, demand ${inputs.demand}%, readiness ${inputs.operations}%, risk tolerance ${inputs.risk}%`,
    `Predicted outcomes: value ${scores.value}/100, risk ${scores.executionRisk}/100, impact ${scores.impact}/100, confidence ${scores.confidence}/100`,
    `Recommendation: ${recommendation.title}`,
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
