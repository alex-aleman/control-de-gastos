let chart;
let transactions = [];

const balanceEl = document.getElementById('balance');
const form = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const list = document.getElementById('transaction-list');
const toggleBtn = document.getElementById('toggle-theme');

form.addEventListener('submit', e => {
  e.preventDefault();
  const description = descriptionInput.value;
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;

  if (!description || isNaN(amount) || !category) return;

  const transaction = {
    id: Date.now(),
    description,
    amount,
    category
  };

  transactions.push(transaction);
  saveAndRender();
  form.reset();
  categoryInput.value = '';
});

function renderTransactions() {
  list.innerHTML = '';
  transactions.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${t.description} — $${t.amount.toFixed(2)}<br><small>📁 ${t.category}</small></span>
      <button onclick="removeTransaction(${t.id})">X</button>
    `;
    li.classList.add(t.amount < 0 ? 'gasto' : 'ingreso');
    list.appendChild(li);
  });
}

function removeTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveAndRender();
}

function updateBalance() {
  const balance = transactions.reduce((acc, t) => acc + t.amount, 0);
  balanceEl.textContent = balance.toFixed(2);
}

function saveAndRender() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  renderTransactions();
  updateBalance();
  updateChart();
}

function updateChart() {
  const ingresos = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const gastos = transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const balance = ingresos - gastos;

  const ctx = document.getElementById('balanceChart').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Ingresos', 'Gastos', 'Balance disponible'],
      datasets: [{
        data: [ingresos, gastos, balance],
        backgroundColor: ['#4caf50', '#f44336', '#2196f3']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function init() {
  const data = localStorage.getItem('transactions');
  if (data) transactions = JSON.parse(data);
  saveAndRender();
}

// Tema oscuro/claro
toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  toggleBtn.textContent = isDark ? '☀️ Modo Claro' : '🌓 Modo Oscuro';
});

window.addEventListener('DOMContentLoaded', () => {
  init();
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    toggleBtn.textContent = '☀️ Modo Claro';
  }

  // Exportar a CSV
  const exportCSV = document.getElementById('export-csv');
  if (exportCSV) {
    exportCSV.addEventListener('click', () => {
      let csv = 'Descripción,Cantidad,Categoría\n';
      transactions.forEach(t => {
        csv += `"${t.description}",${t.amount},"${t.category}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transacciones.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Exportar a JSON
  const exportJSON = document.getElementById('export-json');
  if (exportJSON) {
    exportJSON.addEventListener('click', () => {
      const dataStr = JSON.stringify(transactions, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transacciones.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Importar desde JSON
  const importInput = document.getElementById('import-json');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(event) {
        try {
          const data = JSON.parse(event.target.result);
          if (
            Array.isArray(data) &&
            data.every(t =>
              typeof t.description === 'string' &&
              typeof t.amount === 'number' &&
              typeof t.category === 'string'
            )
          ) {
            transactions = data;
            saveAndRender();
            alert('Transacciones importadas correctamente.');
          } else {
            alert('El archivo JSON no tiene el formato correcto.');
          }
        } catch (err) {
          alert('Error al leer el archivo JSON.');
        }
      };

      reader.readAsText(file);
    });
  }

  // Borrar transacciones
  const clearBtn = document.getElementById('clear-transactions');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const confirmacion = confirm('¿Estás seguro de que quieres borrar TODAS las transacciones? Esta acción no se puede deshacer.');
      if (confirmacion) {
        transactions = [];
        localStorage.removeItem('transactions');
        saveAndRender();
      }
    });
  }
});



