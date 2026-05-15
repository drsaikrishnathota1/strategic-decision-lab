const scenarios = {
  healthcare: {
    label: "Healthcare",
    code: "HC-204",
    owner: "COO",
    horizon: "2Q",
    decision: "Expand capacity",
    baseRevenue: 5.4,
    baseCost: 2.1,
    factor: { value: 1.04, risk: 1.12, impact: 1.18 },
    actions: [
      ["Audit", "Demand and staffing variance"],
      ["Pilot", "Two sites with guardrails"],
      ["Scale", "Capacity where KPIs lift"],
    ],
  },
  retail: {
    label: "Retail",
    code: "RT-118",
    owner: "Merch",
    horizon: "Season",
    decision: "Rebalance inventory",
    baseRevenue: 4.6,
    baseCost: 1.8,
    factor: { value: 1.12, risk: 1.04, impact: 0.98 },
    actions: [
      ["Segment", "SKUs by margin and demand"],
      ["Shift", "Buy toward resilient lines"],
      ["Tune", "Weekly sell-through response"],
    ],
  },
  education: {
    label: "Education",
    code: "ED-307",
    owner: "Provost",
    horizon: "Year",
    decision: "Target aid and advising",
    baseRevenue: 6.8,
    baseCost: 2.6,
    factor: { value: 0.96, risk: 0.92, impact: 1.2 },
    actions: [
      ["Find", "Cohorts with yield risk"],
      ["Launch", "Advising intervention"],
      ["Redirect", "Aid toward measured lift"],
    ],
  },
  finance: {
    label: "Finance",
    code: "FN-512",
    owner: "CRO",
    horizon: "90D",
    decision: "Adaptive fraud controls",
    baseRevenue: 3.9,
    baseCost: 1.5,
    factor: { value: 1.08, risk: 1.2, impact: 0.94 },
    actions: [
      ["Audit", "Loss and false positives"],
      ["Deploy", "Controls by risk band"],
      ["Tune", "Thresholds by friction"],
    ],
  },
  supply: {
    label: "Supply Chain",
    code: "SC-276",
    owner: "Ops",
    horizon: "2Q",
    decision: "Fund resilience buffers",
    baseRevenue: 7.2,
    baseCost: 2.9,
    factor: { value: 1.01, risk: 1.08, impact: 1.1 },
    actions: [
      ["Rank", "Nodes by recovery time"],
      ["Secure", "Backup capacity"],
      ["Stress", "Service level buffers"],
    ],
  },
};

const controls = ["budget", "demand", "operations", "risk"];
const state = {
  activeView: "drivers",
  pulse: 0,
  scores: null,
  inputs: null,
  scenario: null,
  particles: [],
};

const elements = Object.fromEntries(
  [
    "decisionCanvas",
    "scenarioSelect",
    "caseCode",
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
    "copyButton",
    "resetButton",
    "simulateButton",
    "optimizeButton",
    "compareButton",
    "riskBadge",
    "drawerTitle",
    "drawerContent",
    ...controls,
    ...controls.map((name) => `${name}Value`),
  ].map((id) => [id, document.getElementById(id)]),
);

const ctx = elements.decisionCanvas.getContext("2d");

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
      title: "Scale",
      stage: "Go",
      governance: "Monthly",
      text: "Strong upside with contained delivery risk. Expand with leading indicators and a clear owner.",
    };
  }
  if (scores.value >= 66 && scores.executionRisk > 55) {
    return {
      title: "Pilot",
      stage: "Guardrails",
      governance: "Weekly",
      text: "Good value, high uncertainty. Launch a narrow pilot and require evidence before scale.",
    };
  }
  if (scores.impact >= 70 && scores.confidence < 66) {
    return {
      title: "Validate",
      stage: "Evidence",
      governance: "Review",
      text: "Impact is attractive, but confidence needs stronger data on adoption and capacity.",
    };
  }
  return {
    title: "Monitor",
    stage: "Watch",
    governance: "Biweekly",
    text: "Hold the major commitment, improve readiness, and monitor the signal most likely to change the call.",
  };
}

function riskDrivers(inputs, scores) {
  return [
    {
      label: "Demand",
      detail: "Volume and timing pressure",
      value: clamp(inputs.demand * 0.72 + (100 - inputs.operations) * 0.28),
    },
    {
      label: "Readiness",
      detail: "Process and capacity gap",
      value: clamp((100 - inputs.operations) * 0.82 + inputs.budget * 0.18),
    },
    {
      label: "Exposure",
      detail: "Accepted downside",
      value: clamp(inputs.risk * 0.68 + scores.executionRisk * 0.32),
    },
  ].sort((a, b) => b.value - a.value);
}

function sensitivity(inputs, scenario) {
  const base = score(inputs, scenario).confidence;
  return controls
    .map((name) => {
      const changed = { ...inputs, [name]: clamp(inputs[name] + 10) };
      const labels = {
        budget: "Invest",
        demand: "Demand",
        operations: "Ready",
        risk: "Risk",
      };
      return { label: labels[name], detail: "+10 input move", value: score(changed, scenario).confidence - base };
    })
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

function renderRows(items, type = "bar") {
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  return items
    .map((item) => {
      const width = Math.max(8, (Math.abs(item.value) / max) * 100);
      const value = item.value > 0 && type !== "bar" ? `+${item.value}` : item.value;
      return `
        <div class="${type === "action" ? "action-row" : "data-row"}">
          <span>${item.label}</span>
          <small>${value}</small>
          <small>${item.detail}</small>
          ${type === "bar" ? `<div class="bar-track"><div class="bar-fill" style="width: ${width}%"></div></div>` : ""}
        </div>
      `;
    })
    .join("");
}

function setDrawer() {
  const { scenario, inputs, scores } = state;
  const drivers = riskDrivers(inputs, scores);
  const titles = {
    drivers: "Risk Drivers",
    sensitivity: "Sensitivity",
    actions: "Actions",
    brief: "Brief",
  };

  elements.drawerTitle.textContent = titles[state.activeView];

  if (state.activeView === "drivers") {
    elements.drawerContent.innerHTML = renderRows(drivers);
  }
  if (state.activeView === "sensitivity") {
    elements.drawerContent.innerHTML = renderRows(sensitivity(inputs, scenario), "delta");
  }
  if (state.activeView === "actions") {
    elements.drawerContent.innerHTML = renderRows(
      scenario.actions.map(([label, detail], index) => ({ label, detail, value: index + 1 })),
      "action",
    );
  }
  if (state.activeView === "brief") {
    elements.drawerContent.innerHTML = renderRows(
      [
        { label: scenario.decision, detail: scenario.owner, value: scenario.horizon },
        { label: "Value", detail: currency(scores.netValue), value: `${scores.value}/100` },
        { label: "Risk", detail: currency(scores.riskExposure), value: `${scores.executionRisk}/100` },
      ],
      "action",
    );
  }
}

function setActiveButton(button) {
  document.querySelectorAll(".primary-action, .nav-action").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
}

function update() {
  const scenario = scenarios[elements.scenarioSelect.value];
  const inputs = getInputs();
  const scores = score(inputs, scenario);
  const recommendation = classify(scores);
  const drivers = riskDrivers(inputs, scores);

  state.scenario = scenario;
  state.inputs = inputs;
  state.scores = scores;
  state.pulse = 1;

  controls.forEach((name) => {
    elements[`${name}Value`].textContent = `${inputs[name]}%`;
  });

  elements.caseCode.textContent = scenario.code;
  elements.valueScore.textContent = currency(scores.netValue);
  elements.riskScore.textContent = `${scores.executionRisk}`;
  elements.impactScore.textContent = `${scores.serviceLift >= 0 ? "+" : ""}${scores.serviceLift}%`;
  elements.confidenceScore.textContent = `${scores.confidence}`;
  elements.valueDetail.textContent = `${scores.value}/100`;
  elements.riskDetail.textContent = currency(scores.riskExposure);
  elements.impactDetail.textContent = `${scores.impact}/100`;
  elements.confidenceDetail.textContent = scenario.owner;
  elements.recommendationTitle.textContent = recommendation.title;
  elements.recommendationText.textContent = recommendation.text;
  elements.decisionStage.textContent = recommendation.stage;
  elements.governanceLevel.textContent = recommendation.governance;
  elements.riskBadge.textContent = drivers[0].value >= 70 ? "High" : drivers[0].value >= 50 ? "Med" : "Low";

  elements.decisionBrief.textContent = [
    `${scenario.label} ${scenario.code}`,
    `Decision: ${scenario.decision}`,
    `Value: ${currency(scores.netValue)} | Risk: ${currency(scores.riskExposure)} | Confidence: ${scores.confidence}/100`,
    `Move: ${recommendation.title}`,
    `Driver: ${drivers[0].label} ${drivers[0].value}/100`,
  ].join("\n");

  setDrawer();
}

function reset() {
  elements.scenarioSelect.value = "healthcare";
  elements.budget.value = 55;
  elements.demand.value = 62;
  elements.operations.value = 58;
  elements.risk.value = 48;
  update();
}

function optimize() {
  elements.operations.value = clamp(Number(elements.operations.value) + 14);
  elements.risk.value = clamp(Number(elements.risk.value) - 10);
  elements.budget.value = clamp(Number(elements.budget.value) + 6);
  update();
}

function compare() {
  elements.demand.value = clamp(Number(elements.demand.value) + 10);
  elements.risk.value = clamp(Number(elements.risk.value) + 8);
  update();
}

function initParticles() {
  state.particles = Array.from({ length: 90 }, (_, index) => {
    const ring = index % 3;
    return {
      angle: (index / 90) * Math.PI * 2,
      spin: 0.0025 + ring * 0.0012,
      radius: 95 + ring * 58 + Math.random() * 18,
      z: Math.random() * Math.PI * 2,
      size: 1.5 + Math.random() * 2.4,
    };
  });
}

function resizeCanvas() {
  const rect = elements.decisionCanvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  elements.decisionCanvas.width = Math.max(1, Math.floor(rect.width * scale));
  elements.decisionCanvas.height = Math.max(1, Math.floor(rect.height * scale));
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function drawScene(time = 0) {
  const canvas = elements.decisionCanvas;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const centerX = width / 2;
  const centerY = height / 2 + (width < 900 ? -30 : 20);
  const scores = state.scores || score(getInputs(), scenarios[elements.scenarioSelect.value]);
  const pulse = state.pulse;
  state.pulse *= 0.94;

  ctx.clearRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, Math.min(width, height) * 0.52);
  glow.addColorStop(0, "rgba(45, 212, 191, 0.26)");
  glow.addColorStop(0.48, "rgba(125, 211, 252, 0.10)");
  glow.addColorStop(1, "rgba(16, 24, 32, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const sphereRadius = Math.min(width, height) * 0.2 + scores.confidence * 0.45 + pulse * 16;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(Math.sin(time / 2600) * 0.08);

  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.ellipse(0, 0, sphereRadius + i * 11, (sphereRadius + i * 11) * (0.28 + i * 0.04), time / 1800 + i, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${i % 2 ? "125, 211, 252" : "45, 212, 191"}, ${0.24 - i * 0.025})`;
    ctx.lineWidth = 1.25;
    ctx.stroke();
  }

  state.particles.forEach((particle, index) => {
    particle.angle += particle.spin + scores.value / 90000;
    const depth = Math.sin(particle.angle + particle.z);
    const x = Math.cos(particle.angle) * particle.radius;
    const y = Math.sin(particle.angle + index * 0.08) * particle.radius * 0.42 + depth * 18;
    const alpha = 0.35 + depth * 0.22;
    ctx.beginPath();
    ctx.arc(x, y, particle.size + depth * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(183, 245, 223, ${Math.max(0.12, alpha)})`;
    ctx.fill();
  });

  ctx.beginPath();
  ctx.arc(0, 0, sphereRadius * 0.58, 0, Math.PI * 2);
  const core = ctx.createRadialGradient(0, 0, 4, 0, 0, sphereRadius * 0.58);
  core.addColorStop(0, "rgba(255, 255, 255, 0.92)");
  core.addColorStop(0.24, "rgba(45, 212, 191, 0.62)");
  core.addColorStop(1, "rgba(45, 212, 191, 0.06)");
  ctx.fillStyle = core;
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "rgba(237, 244, 242, 0.88)";
  ctx.font = "800 13px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${scores.confidence}/100 CONFIDENCE`, centerX, centerY + sphereRadius + 54);

  requestAnimationFrame(drawScene);
}

controls.forEach((name) => elements[name].addEventListener("input", update));
elements.scenarioSelect.addEventListener("change", update);
elements.resetButton.addEventListener("click", reset);
elements.optimizeButton.addEventListener("click", () => {
  setActiveButton(elements.optimizeButton);
  optimize();
});
elements.compareButton.addEventListener("click", () => {
  setActiveButton(elements.compareButton);
  compare();
});
elements.simulateButton.addEventListener("click", () => {
  setActiveButton(elements.simulateButton);
  update();
});
elements.copyButton.addEventListener("click", async () => {
  setActiveButton(elements.copyButton);
  await navigator.clipboard.writeText(elements.decisionBrief.textContent);
  elements.copyButton.textContent = "Copied";
  setTimeout(() => {
    elements.copyButton.textContent = "Brief";
  }, 1200);
});

document.querySelectorAll(".tool-card").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tool-card").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    state.activeView = button.dataset.view;
    setDrawer();
  });
});

window.addEventListener("resize", resizeCanvas);

initParticles();
resizeCanvas();
update();
requestAnimationFrame(drawScene);
