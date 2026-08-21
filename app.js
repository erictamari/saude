// ============================================================
//  app.js – Sistema Minha Saúde
// ============================================================

// ---------- DADOS PADRÃO ----------
const DADOS_PADRAO = {
  especialidades: [
    { id: 'cardiologia', nome: 'Cardiologia', icone: '❤️' },
    { id: 'gastro', nome: 'Gastroenterologia', icone: '🍽️' },
    { id: 'oftalmo', nome: 'Oftalmologia', icone: '👁️' },
    { id: 'ortopedia', nome: 'Ortopedia', icone: '🦴' },
    { id: 'dermatologia', nome: 'Dermatologia', icone: '🧴' },
    { id: 'neurologia', nome: 'Neurologia', icone: '🧠' },
    { id: 'ginecologia', nome: 'Ginecologia', icone: '👩‍⚕️' },
    { id: 'urologia', nome: 'Urologia', icone: '🔬' }
  ],
  historico: {},
  examesSangue: []
};

// Inicializa histórico para cada especialidade
DADOS_PADRAO.especialidades.forEach(esp => {
  DADOS_PADRAO.historico[esp.id] = {
    consultas: [],
    exames: [],
    proximaConsulta: null,
    recomendacoes: { melhorar: '', fazer: '', medicamentos: '' }
  };
});

// ---------- GERENCIAMENTO DE DADOS ----------
let dados = {};

function carregarDados() {
  const stored = localStorage.getItem('minhaSaude');
  if (stored) {
    try {
      dados = JSON.parse(stored);
      // Garante que todas as especialidades existam
      DADOS_PADRAO.especialidades.forEach(esp => {
        if (!dados.historico[esp.id]) {
          dados.historico[esp.id] = {
            consultas: [],
            exames: [],
            proximaConsulta: null,
            recomendacoes: { melhorar: '', fazer: '', medicamentos: '' }
          };
        }
      });
      return;
    } catch (e) {
      console.warn('Erro ao parsear dados, usando padrão');
    }
  }
  dados = JSON.parse(JSON.stringify(DADOS_PADRAO));
}

function salvarDados() {
  localStorage.setItem('minhaSaude', JSON.stringify(dados));
}

carregarDados();

// ---------- REFERÊNCIAS DOM ----------
const contentArea = document.getElementById('contentArea');
const pageTitle = document.getElementById('pageTitle');
const especialidadesMenu = document.getElementById('especialidades-menu');
const sidebar = document.querySelector('.sidebar');
const menuToggle = document.getElementById('menuToggle');
const refreshBtn = document.getElementById('refreshBtn');

// ---------- RENDERIZAR MENU LATERAL ----------
function renderizarMenu() {
  // Especialidades
  especialidadesMenu.innerHTML = '';
  dados.especialidades.forEach(esp => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.dataset.view = esp.id;
    li.innerHTML = `
      <span class="nav-icon">${esp.icone}</span>
      <span class="nav-label">${esp.nome}</span>
    `;
    li.addEventListener('click', () => {
      navegarPara(esp.id);
      fecharMenuMobile();
    });
    especialidadesMenu.appendChild(li);
  });

  // Eventos dos itens fixos
  document.querySelectorAll('.nav-item[data-view]').forEach(el => {
    el.addEventListener('click', (e) => {
      const view = el.dataset.view;
      navegarPara(view);
      fecharMenuMobile();
    });
  });
}

function fecharMenuMobile() {
  if (window.innerWidth <= 768) {
    sidebar.classList.remove('open');
  }
}

// ---------- NAVEGAÇÃO ----------
function navegarPara(view) {
  // Atualiza active
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const target = document.querySelector(`.nav-item[data-view="${view}"]`);
  if (target) target.classList.add('active');

  switch (view) {
    case 'dashboard':
      renderizarDashboard();
      pageTitle.textContent = '📊 Dashboard';
      break;
    case 'exames-sangue':
      renderizarExamesSangue();
      pageTitle.textContent = '🧪 Exames de Sangue';
      break;
    case 'configuracoes':
      renderizarConfiguracoes();
      pageTitle.textContent = '⚙️ Configurações';
      break;
    default:
      // Especialidade
      const esp = dados.especialidades.find(e => e.id === view);
      if (esp) {
        renderizarEspecialidade(esp.id);
        pageTitle.textContent = `${esp.icone} ${esp.nome}`;
      }
      break;
  }
}

// ---------- DASHBOARD ----------
function renderizarDashboard() {
  const hoje = new Date();
  const hojeStr = hoje.toISOString().slice(0,10);

  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:12px;">
      <h2 style="font-weight:300; color:#1e2a3a;">Visão Geral da Saúde</h2>
      <span style="color:#7f8c8d; font-size:0.9rem;">Última atualização: ${hoje.toLocaleString('pt-BR')}</span>
    </div>
    <div class="dashboard-grid">
  `;

  dados.especialidades.forEach(esp => {
    const hist = dados.historico[esp.id];
    const ultimaConsulta = hist.consultas.length > 0 ? hist.consultas[hist.consultas.length - 1] : null;
    const prox = hist.proximaConsulta;

    let ultimaStr = 'Nunca';
    if (ultimaConsulta) {
      const d = new Date(ultimaConsulta.data);
      ultimaStr = d.toLocaleDateString('pt-BR');
    }

    let diasFaltam = '--';
    let classeDestaque = '';
    if (prox && prox.data) {
      const proxDate = new Date(prox.data);
      const diff = Math.ceil((proxDate - hoje) / (1000 * 60 * 60 * 24));
      diasFaltam = diff >= 0 ? diff : 'Atrasado';
      if (typeof diasFaltam === 'number' && diasFaltam <= 7) classeDestaque = 'highlight';
    }

    html += `
      <div class="card" onclick="navegarPara('${esp.id}')" style="cursor:pointer;">
        <h3>${esp.icone} ${esp.nome}</h3>
        <div class="info-line"><span class="label">Última visita</span><span class="value">${ultimaStr}</span></div>
        <div class="info-line"><span class="label">Próxima consulta</span><span class="value ${classeDestaque}">${diasFaltam === '--' ? 'Não agendada' : diasFaltam + ' dias'}</span></div>
        <div style="margin-top:8px; font-size:0.9rem; color:#7f8c8d;">${hist.exames.length} exames registrados</div>
      </div>
    `;
  });

  html += `</div>`;

  // Card resumo exames sangue
  const ultimoSangue = dados.examesSangue.length > 0 ? dados.examesSangue[dados.examesSangue.length - 1] : null;
  html += `
    <div class="card" style="margin-top:24px; cursor:pointer;" onclick="navegarPara('exames-sangue')">
      <h3>🧪 Exames de Sangue</h3>
      <div class="info-line"><span class="label">Último exame</span><span class="value">${ultimoSangue ? new Date(ultimoSangue.data).toLocaleDateString('pt-BR') : 'Nenhum'}</span></div>
      <div class="info-line"><span class="label">Total de exames</span><span class="value">${dados.examesSangue.length}</span></div>
    </div>
  `;

  contentArea.innerHTML = html;
  document.getElementById('currentDate').textContent = hoje.toLocaleDateString('pt-BR');
}

// ---------- ESPECIALIDADE ----------
function renderizarEspecialidade(id) {
  const esp = dados.especialidades.find(e => e.id === id);
  if (!esp) return;
  const hist = dados.historico[id];

  // Contador regressivo
  let countdownHtml = '';
  if (hist.proximaConsulta && hist.proximaConsulta.data) {
    const proxDate = new Date(hist.proximaConsulta.data);
    const hoje = new Date();
    const diff = Math.ceil((proxDate - hoje) / (1000 * 60 * 60 * 24));
    const texto = diff >= 0 ? `${diff} dias` : 'Atrasado!';
    countdownHtml = `<div class="countdown-box"><span class="label">Próxima consulta:</span> ${texto}</div>`;
  } else {
    countdownHtml = `<div class="countdown-box" style="background:#ecf0f1; color:#7f8c8d;"><span class="label">Próxima consulta:</span> Não agendada</div>`;
  }

  let html = `
    <div class="especialidade-header">
      <h2>${esp.icone} ${esp.nome}</h2>
      ${countdownHtml}
    </div>
  `;

  // ---- CONSULTAS ----
  html += `<div class="section-block">
    <h3>📅 Consultas <span class="badge">${hist.consultas.length}</span></h3>
    <div class="item-list">`;
  if (hist.consultas.length === 0) {
    html += `<div style="color:#95a5a6; padding:8px 0;">Nenhuma consulta registrada.</div>`;
  } else {
    hist.consultas.slice().reverse().forEach((c, idx) => {
      const d = new Date(c.data);
      html += `
        <div class="item-row">
          <div class="item-info">
            <span class="desc">${c.medico || 'Médico não informado'}</span>
            <span class="date">${d.toLocaleDateString('pt-BR')} ${c.observacoes ? '– ' + c.observacoes : ''}</span>
          </div>
          <div class="item-actions">
            <button class="btn btn-sm btn-danger" onclick="removerConsulta('${id}', ${idx})">✕</button>
          </div>
        </div>
      `;
    });
  }
  html += `</div>
    <div class="inline-form">
      <input type="date" id="consultaData" value="${new Date().toISOString().slice(0,10)}" />
      <input type="text" id="consultaMedico" placeholder="Nome do médico" />
      <input type="text" id="consultaObs" placeholder="Observações (opcional)" />
      <button class="btn btn-success" onclick="adicionarConsulta('${id}')">+ Adicionar</button>
    </div>
  </div>`;

  // ---- EXAMES COM UPLOAD ----
  html += `<div class="section-block">
    <h3>📄 Exames Realizados <span class="badge">${hist.exames.length}</span></h3>
    <div class="item-list">`;
  if (hist.exames.length === 0) {
    html += `<div style="color:#95a5a6; padding:8px 0;">Nenhum exame registrado.</div>`;
  } else {
    hist.exames.slice().reverse().forEach((ex, idx) => {
      const d = new Date(ex.data);
      html += `
        <div class="item-row">
          <div class="item-info">
            <span class="desc">${ex.nome || 'Exame'}</span>
            <span class="date">${d.toLocaleDateString('pt-BR')}</span>
            ${ex.arquivo ? `<span style="font-size:0.8rem; color:#3498db;">📎 Anexo</span>` : ''}
          </div>
          <div class="item-actions">
            ${ex.arquivo ? `<button class="btn btn-sm btn-secondary" onclick="baixarArquivo('${id}', ${idx})">📥</button>` : ''}
            <button class="btn btn-sm btn-danger" onclick="removerExame('${id}', ${idx})">✕</button>
          </div>
        </div>
      `;
    });
  }
  html += `</div>
    <div class="upload-area" id="uploadArea_${id}">
      <span class="upload-label">📎 <strong>Clique ou arraste</strong> para anexar exame (PDF, PNG, JPEG)</span>
      <input type="file" id="fileInput_${id}" accept=".pdf,.png,.jpg,.jpeg" multiple />
    </div>
    <div class="inline-form">
      <input type="date" id="exameData_${id}" value="${new Date().toISOString().slice(0,10)}" />
      <input type="text" id="exameNome_${id}" placeholder="Nome do exame" />
      <button class="btn btn-success" onclick="adicionarExame('${id}')">+ Adicionar sem anexo</button>
    </div>
  </div>`;

  // ---- AGENDAMENTO PRÓXIMA CONSULTA ----
  const prox = hist.proximaConsulta || { data: '', descricao: '' };
  html += `<div class="section-block">
    <h3>📆 Agendamento da Próxima Consulta</h3>
    <div class="inline-form">
      <input type="date" id="proxData_${id}" value="${prox.data || ''}" />
      <input type="text" id="proxDesc_${id}" placeholder="Descrição (opcional)" value="${prox.descricao || ''}" />
      <button class="btn btn-primary" onclick="salvarProximaConsulta('${id}')">Salvar</button>
      ${prox.data ? `<button class="btn btn-danger" onclick="removerProximaConsulta('${id}')">Remover</button>` : ''}
    </div>
  </div>`;

  // ---- RECOMENDAÇÕES ----
  const rec = hist.recomendacoes || { melhorar: '', fazer: '', medicamentos: '' };
  html += `<div class="section-block">
    <h3>💡 Recomendações de Saúde</h3>
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div><label style="font-weight:500;">🔹 O que melhorar:</label><br>
        <textarea id="recMelhorar_${id}" rows="2" style="width:100%; padding:8px; border:1px solid #dce1e8; border-radius:8px;">${rec.melhorar || ''}</textarea>
      </div>
      <div><label style="font-weight:500;">🔸 O que fazer:</label><br>
        <textarea id="recFazer_${id}" rows="2" style="width:100%; padding:8px; border:1px solid #dce1e8; border-radius:8px;">${rec.fazer || ''}</textarea>
      </div>
      <div><label style="font-weight:500;">💊 Medicamentos:</label><br>
        <textarea id="recMedicamentos_${id}" rows="2" style="width:100%; padding:8px; border:1px solid #dce1e8; border-radius:8px;">${rec.medicamentos || ''}</textarea>
      </div>
      <button class="btn btn-primary" onclick="salvarRecomendacoes('${id}')">Salvar Recomendações</button>
    </div>
  </div>`;

  contentArea.innerHTML = html;

  // Configurar upload
  configurarUpload(id);

  // Atualizar contador a cada minuto
  if (hist.proximaConsulta && hist.proximaConsulta.data) {
    iniciarContador(id);
  }
}

// ---------- FUNÇÕES DE MANIPULAÇÃO (ESPECIALIDADE) ----------
function adicionarConsulta(id) {
  const data = document.getElementById('consultaData').value;
  const medico = document.getElementById('consultaMedico').value.trim() || 'Médico';
  const obs = document.getElementById('consultaObs').value.trim();
  if (!data) return alert('Selecione uma data.');
  dados.historico[id].consultas.push({ data, medico, observacoes: obs });
  salvarDados();
  renderizarEspecialidade(id);
}

function removerConsulta(id, index) {
  const hist = dados.historico[id];
  const realIndex = hist.consultas.length - 1 - index;
  if (realIndex >= 0 && realIndex < hist.consultas.length) {
    hist.consultas.splice(realIndex, 1);
    salvarDados();
    renderizarEspecialidade(id);
  }
}

function configurarUpload(id) {
  const fileInput = document.getElementById(`fileInput_${id}`);
  const uploadArea = document.getElementById(`uploadArea_${id}`);
  if (!fileInput || !uploadArea) return;

  fileInput.addEventListener('change', (e) => {
    for (let f of e.target.files) {
      processarArquivo(id, f);
    }
    fileInput.value = '';
  });

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#2ecc71';
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#bdc3c7';
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#bdc3c7';
    for (let f of e.dataTransfer.files) {
      processarArquivo(id, f);
    }
  });
  uploadArea.addEventListener('click', () => fileInput.click());
}

function processarArquivo(id, file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;
    const nome = file.name;
    const data = new Date().toISOString().slice(0,10);
    dados.historico[id].exames.push({ data, nome, arquivo: base64, tipo: file.type });
    salvarDados();
    renderizarEspecialidade(id);
  };
  reader.readAsDataURL(file);
}

function adicionarExame(id) {
  const data = document.getElementById(`exameData_${id}`).value;
  const nome = document.getElementById(`exameNome_${id}`).value.trim() || 'Exame';
  if (!data) return alert('Selecione uma data.');
  dados.historico[id].exames.push({ data, nome, arquivo: null });
  salvarDados();
  renderizarEspecialidade(id);
}

function removerExame(id, index) {
  const hist = dados.historico[id];
  const realIndex = hist.exames.length - 1 - index;
  if (realIndex >= 0 && realIndex < hist.exames.length) {
    hist.exames.splice(realIndex, 1);
    salvarDados();
    renderizarEspecialidade(id);
  }
}

function baixarArquivo(id, index) {
  const hist = dados.historico[id];
  const realIndex = hist.exames.length - 1 - index;
  const exame = hist.exames[realIndex];
  if (exame && exame.arquivo) {
    const link = document.createElement('a');
    link.href = exame.arquivo;
    link.download = exame.nome || 'exame';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function salvarProximaConsulta(id) {
  const data = document.getElementById(`proxData_${id}`).value;
  const desc = document.getElementById(`proxDesc_${id}`).value.trim();
  if (!data) return alert('Selecione uma data.');
  dados.historico[id].proximaConsulta = { data, descricao: desc };
  salvarDados();
  renderizarEspecialidade(id);
}

function removerProximaConsulta(id) {
  dados.historico[id].proximaConsulta = null;
  salvarDados();
  renderizarEspecialidade(id);
}

function salvarRecomendacoes(id) {
  const melhorar = document.getElementById(`recMelhorar_${id}`).value;
  const fazer = document.getElementById(`recFazer_${id}`).value;
  const medicamentos = document.getElementById(`recMedicamentos_${id}`).value;
  dados.historico[id].recomendacoes = { melhorar, fazer, medicamentos };
  salvarDados();
  alert('Recomendações salvas!');
}

// ---------- CONTADOR REGRESSIVO (atualiza a cada minuto) ----------
let intervalos = {};
function iniciarContador(id) {
  if (intervalos[id]) clearInterval(intervalos[id]);
  intervalos[id] = setInterval(() => {
    const activePage = document.querySelector('.nav-item.active');
    if (activePage && activePage.dataset.view === id) {
      renderizarEspecialidade(id);
    } else {
      clearInterval(intervalos[id]);
    }
  }, 60000);
}

// ---------- EXAMES DE SANGUE ----------
function renderizarExamesSangue() {
  const exames = dados.examesSangue;
  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:20px;">
      <h2 style="font-weight:300;">🧪 Exames de Sangue</h2>
      <button class="btn btn-primary" onclick="toggleFormSangue()">+ Novo Exame</button>
    </div>
  `;

  // Formulário (oculto inicialmente)
  html += `
    <div id="formSangueContainer" style="display:none; background:white; padding:20px; border-radius:12px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
      <h3 style="font-weight:400; margin-bottom:12px;">Novo Exame de Sangue</h3>
      <div class="form-sangue">
        <div><label>Data</label><input type="date" id="sangueData" value="${new Date().toISOString().slice(0,10)}" /></div>
        <div><label>Hemoglobina (g/dL)</label><input type="number" step="0.1" id="sangueHb" /></div>
        <div><label>Glicose (mg/dL)</label><input type="number" step="0.1" id="sangueGlicose" /></div>
        <div><label>Colesterol Total (mg/dL)</label><input type="number" step="0.1" id="sangueColesterol" /></div>
        <div><label>Triglicerídeos (mg/dL)</label><input type="number" step="0.1" id="sangueTrig" /></div>
        <div><label>HDL (mg/dL)</label><input type="number" step="0.1" id="sangueHDL" /></div>
        <div><label>LDL (mg/dL)</label><input type="number" step="0.1" id="sangueLDL" /></div>
        <div><label>Vitamina D (ng/mL)</label><input type="number" step="0.1" id="sangueVitD" /></div>
      </div>
      <div style="margin-top:16px; display:flex; gap:12px;">
        <button class="btn btn-success" onclick="salvarExameSangue()">Salvar</button>
        <button class="btn btn-secondary" onclick="toggleFormSangue()">Cancelar</button>
      </div>
    </div>
  `;

  // Lista e gráfico
  if (exames.length === 0) {
    html += `<div style="color:#95a5a6;">Nenhum exame de sangue registrado.</div>`;
  } else {
    html += `<div class="sangue-grid">`;
    // Tabela histórica
    html += `<div class="section-block"><h3>📋 Histórico</h3><div style="max-height:400px; overflow-y:auto;">`;
    exames.slice().reverse().forEach((ex, idx) => {
      const d = new Date(ex.data);
      const params = ex.parametros || {};
      html += `
        <div class="item-row">
          <div class="item-info">
            <span class="desc">${d.toLocaleDateString('pt-BR')}</span>
            <span style="font-size:0.8rem; color:#7f8c8d;">
              Hb: ${params.hemoglobina ?? '-'} | Glic: ${params.glicose ?? '-'} | Col: ${params.colesterol ?? '-'}
            </span>
          </div>
          <div class="item-actions">
            <button class="btn btn-sm btn-danger" onclick="removerExameSangue(${idx})">✕</button>
          </div>
        </div>
      `;
    });
    html += `</div></div>`;

    // Gráfico comparativo
    html += `<div class="section-block"><h3>📊 Comparativo (últimos 5)</h3><div class="comparativo-container">
      <canvas id="graficoSangue" height="200"></canvas>
    </div></div>`;
    html += `</div>`;
  }

  contentArea.innerHTML = html;

  if (exames.length > 0) {
    setTimeout(() => desenharGraficoSangue(exames), 100);
  }
}

function toggleFormSangue() {
  const container = document.getElementById('formSangueContainer');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
}

function salvarExameSangue() {
  const data = document.getElementById('sangueData').value;
  if (!data) return alert('Selecione a data.');
  const parametros = {
    hemoglobina: parseFloat(document.getElementById('sangueHb').value) || null,
    glicose: parseFloat(document.getElementById('sangueGlicose').value) || null,
    colesterol: parseFloat(document.getElementById('sangueColesterol').value) || null,
    triglicerideos: parseFloat(document.getElementById('sangueTrig').value) || null,
    hdl: parseFloat(document.getElementById('sangueHDL').value) || null,
    ldl: parseFloat(document.getElementById('sangueLDL').value) || null,
    vitaminaD: parseFloat(document.getElementById('sangueVitD').value) || null
  };
  dados.examesSangue.push({ data, parametros });
  salvarDados();
  toggleFormSangue();
  renderizarExamesSangue();
}

function removerExameSangue(index) {
  const realIndex = dados.examesSangue.length - 1 - index;
  if (realIndex >= 0 && realIndex < dados.examesSangue.length) {
    dados.examesSangue.splice(realIndex, 1);
    salvarDados();
    renderizarExamesSangue();
  }
}

function desenharGraficoSangue(exames) {
  const ctx = document.getElementById('graficoSangue');
  if (!ctx) return;
  const ultimos = exames.slice(-5);
  const labels = ultimos.map(e => new Date(e.data).toLocaleDateString('pt-BR'));

  const params = ['hemoglobina', 'glicose', 'colesterol', 'triglicerideos', 'hdl', 'ldl'];
  const cores = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];

  const datasets = params.map((p, i) => {
    const data = ultimos.map(e => e.parametros[p] ?? null);
    if (data.every(v => v === null)) return null;
    return {
      label: p.charAt(0).toUpperCase() + p.slice(1),
      data: data,
      borderColor: cores[i],
      backgroundColor: cores[i] + '22',
      tension: 0.2,
      fill: false,
      pointRadius: 4
    };
  }).filter(d => d !== null);

  if (datasets.length === 0) {
    ctx.parentElement.innerHTML = '<p style="color:#95a5a6;">Dados insuficientes para gráfico.</p>';
    return;
  }

  new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: false } }
    }
  });
}

// ---------- CONFIGURAÇÕES ----------
function renderizarConfiguracoes() {
  const html = `
    <h2 style="font-weight:300;">⚙️ Configurações</h2>
    <div class="section-block" style="margin-top:16px;">
      <h3>Gerenciar Dados</h3>
      <p style="margin-bottom:16px;">Exportar ou importar todos os dados (backup).</p>
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="exportarDados()">📤 Exportar JSON</button>
        <button class="btn btn-secondary" onclick="importarDados()">📥 Importar JSON</button>
        <button class="btn btn-danger" onclick="limparTodosDados()">🗑️ Limpar todos os dados</button>
      </div>
      <input type="file" id="importFile" accept=".json" style="display:none;" onchange="processarImportacao(event)" />
    </div>
  `;
  contentArea.innerHTML = html;
}

function exportarDados() {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `minha_saude_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importarDados() {
  document.getElementById('importFile').click();
}

function processarImportacao(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.especialidades && imported.historico && imported.examesSangue) {
        dados = imported;
        salvarDados();
        renderizarMenu();
        navegarPara('dashboard');
        alert('Dados importados com sucesso!');
      } else {
        alert('Arquivo inválido.');
      }
    } catch (err) {
      alert('Erro ao ler arquivo.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function limparTodosDados() {
  if (confirm('Tem certeza que deseja apagar todos os dados? Essa ação não pode ser desfeita.')) {
    localStorage.removeItem('minhaSaude');
    carregarDados();
    renderizarMenu();
    navegarPara('dashboard');
    alert('Dados limpos.');
  }
}

// ---------- INICIALIZAÇÃO ----------
function init() {
  renderizarMenu();
  navegarPara('dashboard');

  // Menu mobile toggle
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Fechar menu ao clicar fora (mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });

  // Atualizar data
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('pt-BR');

  // Refresh
  refreshBtn.addEventListener('click', () => {
    const active = document.querySelector('.nav-item.active');
    if (active) navegarPara(active.dataset.view);
  });
}

document.addEventListener('DOMContentLoaded', init);
