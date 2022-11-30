function handler(event) {
  id = event.target.id.split("-")[1];
  row = document.getElementById(`row-${id}`);
  if (row.getAttribute("class").includes("d-none")) {
    row.setAttribute("class", "border border-3");
    document.getElementById(`skip_${id}`).removeAttribute("checked");
    event.target.setAttribute("class", "btn btn-primary");
  } else {
    row.setAttribute("class", "border border-3 d-none");
    document.getElementById(`skip_${id}`).setAttribute("checked", "true");
    event.target.setAttribute("class", "btn btn-outline-secondary");
  }
}

document.getElementById("select-all").addEventListener("click", () => {
  for (let w = 1; w < 5; w++) {
    for (let d = 1; d < 8; d++) {
      if (w == 1 && d == 1) continue;
      id = `${w}${d}`;
      document
        .getElementById(`row-${id}`)
        .setAttribute("class", "border border-3");
      document.getElementById(`skip_${id}`).removeAttribute("checked");
      document
        .getElementById(`button-${id}`)
        .setAttribute("class", "btn btn-primary");
    }
  }
});

document.getElementById("clear-all").addEventListener("click", () => {
  for (let w = 1; w < 5; w++) {
    for (let d = 1; d < 8; d++) {
      if (w == 1 && d == 1) continue;
      id = `${w}${d}`;
      document
        .getElementById(`row-${id}`)
        .setAttribute("class", "border border-3 d-none");
      document.getElementById(`skip_${id}`).setAttribute("checked", "true");
      document
        .getElementById(`button-${id}`)
        .setAttribute("class", "btn btn-outline-secondary");
    }
  }
});

function copyValues(from, to) {
  [
    "rbts_",
    "rbtr_",
    "wvis_",
    "wvos_",
    "fsts_",
    "fsds_",
    "dtps_",
    "wvir_",
    "wvor_",
    "fstr_",
    "fsdr_",
    "dtpr_",
    "wvid_",
    "wvod_",
    "fstd_",
    "fsdd_",
    "dtpd_",
  ].forEach((inputName) => {
    document.getElementById(`${inputName}${to}`).value =
      document.getElementById(`${inputName}${from}`).value;
  });
}

function copyAboveHandler(event) {
  let w = parseInt(event.target.id.split("-")[2][0]);
  let d = parseInt(event.target.id.split("-")[2][1]);
  for (let i = 4; i > 0; i--) {
    if (i > w) continue;
    for (let j = 7; j > 0; j--) {
      if (i == w && j >= d) continue;
      let row = document.getElementById(`row-${i}${j}`);
      if (!row.getAttribute("class").includes("d-none")) {
        copyValues(`${i}${j}`, `${w}${d}`);
        i = 0;
        break;
      }
    }
  }
}

function copyBelowHandler(event) {
  let w = parseInt(event.target.id.split("-")[2][0]);
  let d = parseInt(event.target.id.split("-")[2][1]);
  for (let i = 1; i < 5; i++) {
    if (i < w) continue;
    for (let j = 1; j < 8; j++) {
      if (i == w && j <= d) continue;
      let row = document.getElementById(`row-${i}${j}`);
      if (!row.getAttribute("class").includes("d-none")) {
        copyValues(`${i}${j}`, `${w}${d}`);
        i = 5;
        break;
      }
    }
  }
}

for (let w = 1; w < 5; w++) {
  for (let d = 1; d < 8; d++) {
    if (!(w == 1 && d == 1)) {
      document
        .getElementById(`button-${w}${d}`)
        .addEventListener("click", handler);
      document
        .getElementById(`copy-above-${w}${d}`)
        .addEventListener("click", copyAboveHandler);
    }
    if (!(w == 4 && d == 7)) {
      document
        .getElementById(`copy-below-${w}${d}`)
        .addEventListener("click", copyBelowHandler);
    }
  }
}

Object.values(document.getElementsByClassName("alert")).forEach((el) => {
  if (el.innerText.includes("requires some additional values")) {
    let id = el.innerText.split(" ")[1].split("-");
    let w = id[0];
    let d = id[1];
    document
      .getElementById(`row-${w}${d}`)
      .setAttribute("class", "border border-3");
    document.getElementById(`skip_${w}${d}`).removeAttribute("checked");
    document
      .getElementById(`button-${w}${d}`)
      .setAttribute("class", "btn btn-primary");
  }
});

Object.values(document.getElementsByClassName("form-check-input")).forEach(
  (val) => {
    if (!val.hasAttribute("checked")) {
      let id = val.getAttribute("id").split("_")[1];
      let w = id[0];
      let d = id[1];
      document
        .getElementById(`row-${w}${d}`)
        .setAttribute("class", "border border-3");
      document.getElementById(`skip_${w}${d}`).removeAttribute("checked");
      document
        .getElementById(`button-${w}${d}`)
        .setAttribute("class", "btn btn-primary");
    }
  }
);
