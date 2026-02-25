let masterDept = JSON.parse(localStorage.getItem('masterDept')) || [{ name: "Utility", code: "UT" }];
let masterBarang = JSON.parse(localStorage.getItem('masterBarang')) || [];
let riwayatData = JSON.parse(localStorage.getItem('riwayatData')) || [];
let myChart = null;

window.onload = () => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('loginPage').classList.add('d-none');
        document.getElementById('userDisplay').innerText = `PETUGAS: ${localStorage.getItem('userEmail')}`;
        refreshAllUI();
    }
};

function handleLogin() {

    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;

    if(email === "admin@safety.com" && pass === "safetyfirst123")

    {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        location.reload();
    }
    else
    {
        alert("Email atau password salah!");
    }

}


function handleLogout() { localStorage.clear(); location.reload(); }

function showSection(id, el) {
    document.querySelectorAll('section').forEach(s => s.classList.add('d-none'));
    document.getElementById('sect-' + id).classList.remove('d-none');
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    
    if (id === 'dash') updateDashboard();
    if (id === 'perawatan') refreshAllUI();
    if (id === 'riwayat') {

    renderRiwayatTable();

    renderDownloadButtons();

    loadFilterDeptRiwayat();

}
    if (id === 'pengaturan') renderDeptLists();
}

// --- LOGIC RENDER RIWAYAT (UPDATE: LOKASI, TANPA SAMPAH, WARNA STATUS) ---
function renderRiwayatTable() {

const container =
document.getElementById("tabelRiwayat");

const dataSorted =
[...riwayatData].reverse();

container.innerHTML =
dataSorted.map((r,i)=>{

const isVerified =
r.isVerified;

return `

<tr>

<td class="ps-3">
<div class="fw-bold" style="color:black;">${r.tgl}</div>
<small>${r.inspektor}</small>
</td>

<td>
<span class="badge bg-secondary">
${masterBarang.find(b=>b.id===r.id_apd)?.dept||"-"}
</span>
</td>

<td class="fw-bold text-dark">
${r.item}
</td>

<td>
<code style="color:black;">
${r.id_apd}
</code>
</td>

<td class="text-muted">
${r.lokasi}
</td>

<td>
<span class="badge-${r.kondisi}">
${r.kondisi}
</span>
</td>

<td>

${isVerified ?

`<span class="badge bg-success text-white p-1 px-2 rounded small">
VERIF: ${r.petugasK3L}
</span>`

:

`<div class="input-group input-group-sm" style="max-width:150px;">

<input type="text"
id="k3l-${i}"
class="form-control border-secondary"
style="background-color:white;color:black;"
placeholder="K3L">

<button class="btn btn-crimson"
onclick="verifikasiK3L(${i})">

OK

</button>

</div>`

}

</td>

</tr>

`;

}).join("");

}
function verifikasiK3L(index) {
    const input = document.getElementById(`k3l-${index}`);
    if (!input.value) return alert("Isi nama petugas K3L!");
    
    // Karena di render data di reverse, kita ambil index aslinya
    const dataSorted = [...riwayatData].reverse();
    const itemTarget = dataSorted[index];
    
    // Cari index asli di array riwayatData
    const originalIndex = riwayatData.findIndex(x => x === itemTarget);
    
    riwayatData[originalIndex].isVerified = true;
    riwayatData[originalIndex].petugasK3L = input.value;
    
    localStorage.setItem('riwayatData', JSON.stringify(riwayatData));
    renderRiwayatTable();
}

// --- FUNGSI MASTER DATA (ACCORDION) ---
function renderDeptLists() {
    const selects = [document.getElementById('deptSelect'), document.getElementById('targetDept'), document.getElementById('filterDeptInv')];
    let optHtml = '<option value="">-- Pilih Dept --</option>';
    masterDept.forEach(d => optHtml += `<option value="${d.name}">${d.name}</option>`);
    selects.forEach(s => { if(s) s.innerHTML = optHtml; });

    const listSetting = document.getElementById('listDeptSettings');
    if(listSetting) {
        listSetting.innerHTML = masterDept.map((d, i) => {
            const jenisApd = [...new Set(masterBarang.filter(b => b.dept === d.name).map(b => b.name))];
            const collapseId = `collapseDept${i}`;
            return `
                <div class="mb-2 border border-secondary rounded bg-dark overflow-hidden">
                    <div class="d-flex justify-content-between align-items-center p-2 bg-charcoal">
                        <div class="d-flex align-items-center" onclick="const el = document.getElementById('${collapseId}'); el.classList.toggle('d-none'); this.querySelector('i').classList.toggle('fa-rotate-180');" style="cursor:pointer">
                            <i class="fas fa-chevron-down me-2 text-muted transition-all"></i>
                            <span class="fw-bold text-crimson small">${d.name} (${d.code})</span>
                        </div>
                        <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteDepartment(${i})"><i class="fas fa-trash-alt"></i></button>
                    </div>
                    <div id="${collapseId}" class="d-none ps-3 pe-2 pb-2 pt-1 border-top border-secondary bg-black bg-opacity-25">
                        ${jenisApd.map(name => `
                            <div class="d-flex justify-content-between align-items-center small mb-1 py-1 border-bottom border-secondary border-opacity-25">
                                <span class="text-white-50" style="font-size: 11px;"><i class="fas fa-tag me-2"></i>${name}</span>
                                <button class="btn btn-sm text-warning p-0" onclick="deleteJenisApd('${d.name}', '${name}')"><i class="fas fa-times"></i></button>
                            </div>
                        `).join('') || '<small class="text-muted">Kosong</small>'}
                    </div>
                </div>`;
        }).join('');
    }
}

// --- FUNGSI PENDUKUNG ---
function saveAndRefresh() {
    localStorage.setItem('masterDept', JSON.stringify(masterDept));
    localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
    refreshAllUI();
}

function deleteDepartment(index) {
    if (confirm("Hapus Departemen & seluruh isinya?")) {
        masterBarang = masterBarang.filter(b => b.dept !== masterDept[index].name);
        masterDept.splice(index, 1);
        saveAndRefresh();
    }
}

function deleteJenisApd(deptName, apdName) {
    if (confirm(`Hapus semua ${apdName} di ${deptName}?`)) {
        masterBarang = masterBarang.filter(b => !(b.dept === deptName && b.name === apdName));
        saveAndRefresh();
    }
}

function deleteApdAsset(id) {
    if (confirm(`Hapus ID ${id}?`)) {
        masterBarang = masterBarang.filter(b => b.id !== id);
        saveAndRefresh();
    }
}

function updateJenisOptions() {
    const d = document.getElementById('deptSelect').value;
    const j = document.getElementById('jenisApdSelect');
    j.innerHTML = '<option value="">-- Pilih --</option>';
    if (!d) return;
    [...new Set(masterBarang.filter(b => b.dept === d).map(b => b.name))].forEach(v => j.innerHTML += `<option value="${v}">${v}</option>`);
}

function updateIDOptions() {
    const d = document.getElementById('deptSelect').value;
    const j = document.getElementById('jenisApdSelect').value;
    const i = document.getElementById('idApdSelect');
    i.innerHTML = '<option value="">-- Pilih --</option>';
    if (!d || !j) return;
    masterBarang.filter(b => b.dept === d && b.name === j).forEach(b => {
        i.innerHTML += `<option value="${b.id}" ${b.status!=='Baik'?'disabled':''}>${b.id} ${b.status!=='Baik'?'['+b.status+']':''}</option>`;
    });
}

document.getElementById('formInspeksi').onsubmit = function (e) {
    e.preventDefault();
    const id = document.getElementById('idApdSelect').value;
    if(!id) return alert("Pilih ID Tag!");
    const item = masterBarang.find(b => b.id === id);
    riwayatData.push({
        tgl: new Date().toLocaleString('id-ID'),
        inspektor: document.getElementById('inspektorName').value,
        lokasi: document.getElementById('lokasiKerja').value,
        id_apd: id, item: item.name, kondisi: document.getElementById('apdKondisi').value,
        catatan: document.getElementById('apdCatatan').value || "-", isVerified: false, petugasK3L: "-"
    });
    masterBarang[masterBarang.findIndex(b => b.id === id)].status = document.getElementById('apdKondisi').value;
    localStorage.setItem('riwayatData', JSON.stringify(riwayatData));
    saveAndRefresh();
    alert("Berhasil Diinput!"); this.reset();
};

function updateDashboard() {
    const total = masterBarang.length, baik = masterBarang.filter(x => x.status === 'Baik').length, masalah = total - baik;
    document.getElementById('countTotal').innerText = total;
    document.getElementById('countBaik').innerText = baik;
    document.getElementById('countRusak').innerText = masalah;
    if (myChart) myChart.destroy();
    myChart = new Chart(document.getElementById('myChart'), { type: 'doughnut', data: { labels: ['Aman', 'Masalah'], datasets: [{ data: [baik, masalah], backgroundColor: ['#2e7d32', '#d32f2f'], borderWidth: 0 }] }, options: { maintainAspectRatio: false } });
}

function renderTabelInventaris(data) {
    document.getElementById('tabelPerawatan').innerHTML = data.map(b => `
        <tr>
            <td><code class="text-crimson fw-bold">${b.id}</code></td>
            <td class="fw-bold">${b.name}</td>
            <td><span class="badge bg-light text-dark border">${b.dept}</span></td>
            <td><span class="badge-${b.status}">${b.status}</span></td>
            <td><span class="badge-${b.status}">${b.status}</span></td>
            <td><span class="badge-${b.status}">${b.status}</span></td>

        </tr>`).join('');
}

function generateBatchApd() {
    const dName = document.getElementById('targetDept').value, aName = document.getElementById('newApdName').value, qty = parseInt(document.getElementById('genQty').value);
    const d = masterDept.find(x => x.name === dName);
    if (!d || !aName || !qty) return alert("Lengkapi Form!");
    for (let i = 1; i <= qty; i++) {
        const id = `APD-${d.code}-${aName[0].toUpperCase()}-${Math.floor(Math.random()*900)+100}`;
        masterBarang.push({ id, name: aName, dept: dName, status: "Baik" });
    }
    saveAndRefresh();
    alert("Batch APD Berhasil!");
}

function addDepartment() {
    const n = document.getElementById('newDeptName').value, c = document.getElementById('newDeptCode').value.toUpperCase();
    if(n && c) { masterDept.push({name:n, code:c}); document.getElementById('newDeptName').value=""; document.getElementById('newDeptCode').value=""; saveAndRefresh(); }
}

function refreshAllUI() { renderDeptLists(); updateDashboard(); renderTabelInventaris(masterBarang); }
function resetFilterInv() { document.getElementById('filterDeptInv').value=""; document.getElementById('filterNamaInv').value=""; renderTabelInventaris(masterBarang); }
function handleDeptFilterChange() { 
    const dVal = document.getElementById('filterDeptInv').value;
    const nSel = document.getElementById('filterNamaInv');
    nSel.innerHTML = '<option value="">-- Semua Alat --</option>';
    [...new Set(masterBarang.filter(b => !dVal || b.dept === dVal).map(b => b.name))].forEach(n => nSel.innerHTML += `<option value="${n}">${n}</option>`);
    filterInventaris();
}
function filterInventaris() {
    const d = document.getElementById('filterDeptInv').value, n = document.getElementById('filterNamaInv').value;
    const filtered = masterBarang.filter(b => (!d || b.dept === d) && (!n || b.name === n));
    renderTabelInventaris(filtered);
}
function downloadCSVByDept(deptName) {

    const filtered =
    deptName === "SEMUA"
    ? riwayatData
    : riwayatData.filter(r =>
        masterBarang.find(b => b.id === r.id_apd)?.dept === deptName
    );

    let csv =
    "WAKTU,INSPEKTOR,ITEM,ID TAG,LOKASI,KONDISI,VERIFIKASI K3L\n";

    filtered.forEach(r => {

        csv += `"${r.tgl}",`;
        csv += `"${r.inspektor}",`;
        csv += `"${r.item}",`;
        csv += `"${r.id_apd}",`;
        csv += `"${r.lokasi}",`;
        csv += `"${r.kondisi}",`;
        csv += `"${r.petugasK3L}"\n`;

    });

    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);

    link.download = `Log_${deptName}.csv`;

    link.click();

}
function renderDownloadButtons() {
    let h = `<button class="btn btn-dark btn-sm fw-bold" onclick="downloadCSVByDept('SEMUA')">SEMUA DATA</button>`;
    masterDept.forEach(d => h += `<button class="btn btn-outline-danger btn-sm fw-bold" onclick="downloadCSVByDept('${d.name}')">DEPT ${d.name.toUpperCase()}</button>`);
    document.getElementById('downloadButtonsContainer').innerHTML = h;
}

// =======================
// DOWNLOAD EXCEL
// =======================

function downloadExcelRiwayat(){

const data = riwayatData.map(r => {

const dept =
masterBarang.find(b=>b.id===r.id_apd)?.dept || "-";

return {

Tanggal: r.tgl,
Inspektor: r.inspektor,
Departemen: dept,
Item: r.item,
ID_Tag: r.id_apd,
Lokasi: r.lokasi,
Kondisi: r.kondisi,
Verifikasi: r.petugasK3L

};

});

const worksheet =
XLSX.utils.json_to_sheet(data);

const workbook =
XLSX.utils.book_new();

XLSX.utils.book_append_sheet(
workbook,
worksheet,
"Log Riwayat"
);

XLSX.writeFile(
workbook,
"Log_Riwayat_APD.xlsx"
);

}


// =======================
// DOWNLOAD PDF
// =======================

function downloadPDFRiwayat(){

const { jsPDF } = window.jspdf;

const doc = new jsPDF();

const tableColumn = [

"Tanggal",
"Inspektor",
"Departemen",
"Item",
"ID Tag",
"Lokasi",
"Kondisi",
"Verifikasi"

];

const tableRows = [];

riwayatData.forEach(r => {

const dept =
masterBarang.find(b=>b.id===r.id_apd)?.dept || "-";

tableRows.push([

r.tgl,
r.inspektor,
dept,
r.item,
r.id_apd,
r.lokasi,
r.kondisi,
r.petugasK3L

]);

});

doc.text("Log Riwayat APD", 14, 15);

doc.autoTable({

head: [tableColumn],
body: tableRows,
startY: 20

});

doc.save("Log_Riwayat_APD.pdf");

}

function loadFilterDeptRiwayat(){

const select =
document.getElementById("filterDeptRiwayat");

if(!select) return;

select.innerHTML =
'<option value="">SEMUA DEPARTEMEN</option>';

masterDept.forEach(d => {

select.innerHTML +=
`<option value="${d.name}">
${d.name}
</option>`;

});

}

function filterRiwayatByDept(){

const dept =
document.getElementById("filterDeptRiwayat").value;

if(dept === ""){

renderRiwayatTable();
return;

}

const filtered =
riwayatData.filter(r => {

const itemDept =
masterBarang.find(b => b.id === r.id_apd)?.dept;

return itemDept === dept;

});

renderRiwayatTableCustom(filtered);

}

function renderRiwayatTableCustom(data){

const container =
document.getElementById("tabelRiwayat");

container.innerHTML =
data.map((r,i)=>{

const dept =
masterBarang.find(b=>b.id===r.id_apd)?.dept || "-";

return `

<tr>

<td>${r.tgl}<br>${r.inspektor}</td>

<td>${dept}</td>

<td>${r.item}</td>

<td>${r.id_apd}</td>

<td>${r.lokasi}</td>

<td>${r.kondisi}</td>

<td>${r.petugasK3L}</td>

</tr>

`;

}).join("");

}

function filterRiwayat(){

    const mode =
    document.getElementById("filterVerifikasi").value;

    const sekarang = new Date();

    let filtered = riwayatData.filter(r => {

    if(mode === "semua") return true;

    const tglParts = r.tgl.split(',')[0].split('/');
    const tgl = new Date(tglParts[2], tglParts[1]-1, tglParts[0]);

    const selisihHari =
    (sekarang - tgl) / (1000*60*60*24);

    if(mode === "sering")
    return selisihHari <= 30;

    if(mode === "lama")
    return selisihHari > 30;

    });

    renderRiwayatTableCustom(filtered);

}

function renderRiwayatTableCustom(data){

const container =
document.getElementById("tabelRiwayat");

container.innerHTML =
data.map((r,i)=>{

const dept =
masterBarang.find(b=>b.id===r.id_apd)?.dept || "-";

return `

<tr>

<td>
${r.tgl}<br>
${r.inspektor}
</td>

<td>${dept}</td>

<td>${r.item}</td>

<td>${r.id_apd}</td>

<td>${r.lokasi}</td>

<td>${r.kondisi}</td>

<td>${r.petugasK3L}</td>

</tr>

`;

}).join("");

}