//Lista de usuarios eliminados
let delete_list = [];


// Realiza una solicitud GET para obtener la lista de usuarios y actualizar la tabla de usuarios
function fetchUsers() {
  fetch('/usuarios')
    .then(response => response.json())
    .then(users => {
      const tableBody = document.getElementById('users-table-body');
      tableBody.innerHTML = '';

      users.forEach(user => {
        const row = document.createElement('tr');
        row.classList.add(user.nombre); 
        if (delete_list.includes(user.nombre))
          row.classList.add('hide-row');          
        row.innerHTML = `
          <td>${user.nombre}</td>
          <td>${user.balance}</td>
          <td><button class="btn btn-danger delete" onclick="deleteUser('${user.nombre}')">Eliminar</button></td>
          <td><button class="btn btn-danger" onclick="editUser(${user.id}, '${user.nombre}', ${user.balance})">Editar</button></td>
        `;
        tableBody.appendChild(row);
      });
    })
    .catch(error => console.error('Error al obtener los usuarios:', error));
}

// Realiza una solicitud POST para agregar un nuevo usuario
function addUser(event) {
  event.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const balance = parseFloat(document.getElementById('balance').value);

  fetch('/usuario', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ nombre, balance })
  })
    .then(response => {
      if (response.ok) {
        document.getElementById('nombre').value = '';
        document.getElementById('balance').value = '';
        fetchUsers();
        fetchUsersForTransfer(); // Agregado: Actualiza la lista de usuarios en el formulario de transferencia
      } else {
        console.error('Error al agregar un nuevo usuario');
      }
    })
    .catch(error => console.error('Error al agregar un nuevo usuario:', error));
}

// Realiza una solicitud DELETE para eliminar un usuario por su ID
/*function deleteUser(userId) {
  fetch(`/usuario/${userId}`, { method: 'DELETE' })
    .then(response => {
      if (response.ok) {
        fetchUsers('Dalton');
        fetchUsersForTransfer(); // Agregado: Actualiza la lista de usuarios en el formulario de transferencia
      } else {
        console.error('Error al eliminar el usuario');
      }
    })
    .catch(error => console.error('Error al eliminar el usuario:', error));
}
*/

function deleteUser(nombre) {
  try{
    delete_list.push(nombre);
    fetchUsers();
    fetchUsersForTransfer(); // Agregado: Actualiza la lista de usuarios en el formulario de transferencia
    fetchTransfers()
  } 
  catch {
    console.error('Error al eliminar el usuario');
  }
}

// Rellena los campos del formulario de edición con los datos de un usuario
function editUser(userId, nombre, balance) {
  document.getElementById('nombre').value = nombre;
  document.getElementById('balance').value = balance;

  const form = document.getElementById('add-user-form');
  form.removeEventListener('submit', addUser);
  form.addEventListener('submit', event => updateUser(event, userId));
}

// Realiza una solicitud PUT para actualizar los datos de un usuario
function updateUser(event, userId) {
  event.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const balance = parseFloat(document.getElementById('balance').value);

  fetch(`/usuario/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ nombre, balance })
  })
    .then(response => {
      if (response.ok) {
        document.getElementById('nombre').value = '';
        document.getElementById('balance').value = '';
        fetchUsers();
        const form = document.getElementById('add-user-form');
        form.removeEventListener('submit', updateUser);
        form.addEventListener('submit', addUser);
        fetchUsersForTransfer(); // Agregado: Actualiza la lista de usuarios en el formulario de transferencia
      } else {
        console.error('Error al actualizar el usuario');
      }
    })
    .catch(error => console.error('Error al actualizar el usuario:', error));
}

// Realiza una solicitud POST para realizar una nueva transferencia
function transferAmount(event) {
  event.preventDefault();

  const emisor = document.getElementById('emisor').selectedOptions[0].text;;
  const receptor = document.getElementById('receptor').selectedOptions[0].text;;
  const monto = parseInt(document.getElementById('monto').value);

  console.log(emisor, receptor, monto);

  fetch('/transferencias', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ emisor, receptor, monto})
  })
    .then(response => {
      console.log('CONTROL', response.ok, response.status, response.statusText);
      if (response.ok) {
        document.getElementById('emisor').value = 'Emisor';
        document.getElementById('receptor').value = 'Receptor';
        document.getElementById('monto').value = '';
        console.log('Valores recuperados')
        fetchTransfers();
        fetchUsers();
      }
      else {
        console.error('Error 1 al realizar la transferencia');
      }
    })
    .catch(error => console.error('Error 2 al realizar la transferencia:', error));
}

// Realiza una solicitud GET para obtener la lista de transferencias y actualizar la tabla de transferencias
function fetchTransfers() {
  fetch('/transferencias')
    .then(response => response.json())
    .then(transfers => {
      const tableBody = document.getElementById('transfers-table-body');
      tableBody.innerHTML = '';

      transfers.forEach(transfer => {
        const row = document.createElement('tr');
        row.classList.add(transfer.emisor, transfer.receptor)
        if (delete_list.includes(transfer.emisor) || delete_list.includes(transfer.receptor)){
          row.classList.add('hide-row');
        }
        row.innerHTML = `
          <td>${transfer.emisor}</td>
          <td>${transfer.receptor}</td>
          <td>${transfer.monto}</td>
          <td>${transfer.fecha}</td>
        `;
        tableBody.appendChild(row);
      });
    })
    .catch(error => console.error('Error al obtener las transferencias:', error));
}

// Realiza una solicitud GET para obtener la lista de usuarios y actualizar los campos de emisor y receptor en el formulario de transferencia
function fetchUsersForTransfer() {
  fetch('/usuarios')
    .then(response => response.json())
    .then(users => {
      const emisorSelect = document.getElementById('emisor');
      const receptorSelect = document.getElementById('receptor');

      // Limpiar las opciones existentes
      emisorSelect.innerHTML = '<option selected>Emisor</option>';
      receptorSelect.innerHTML = '<option selected>Receptor</option>';

      // Agregar las opciones de los usuarios
      users.forEach(user => {
        const option = document.createElement('option');
        option.classList.add(user.nombre)
        if (delete_list.includes(user.nombre)){
          option.classList.add('hide-row');
        }
        option.value = user.id;
        option.textContent = user.nombre;
        emisorSelect.appendChild(option);
        receptorSelect.appendChild(option.cloneNode(true));
      });
    })
    .catch(error => console.error('Error al obtener los usuarios:', error));
}

// Carga los usuarios, las transferencias y la lista de usuarios en el formulario de transferencia al cargar la página
window.onload = () => {
  fetchUsers();
  fetchTransfers();
  fetchUsersForTransfer();

  const addUserForm = document.getElementById('add-user-form');
  addUserForm.addEventListener('submit', addUser);

  const transferForm = document.getElementById('transfer-form');
  transferForm.addEventListener('submit', transferAmount);
};
