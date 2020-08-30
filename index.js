const express = require("express");
const socket = require("socket.io");
const { v4: uuidv4 } = require('uuid');
const Nodo = require("./classes/Nodo");

// App setup
const PORT = 8000;
const app = express();
const server = app.listen(PORT, function () {
    console.log(`Listening on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});

// Socket setup
const io = socket(server, {pingTimeout: 1000000});

const nodos = []

io.on("connection", function (socket) {
    console.log("Made socket connection");
    const clientId = uuidv4();

    socket.on('node-connect', (data) => {
        console.log("node-connect ", data)

        const nodo = new Nodo(clientId, data.nombre, socket);
        nodos.push(nodo);

        socket.emit('node-connect-complete',{id: clientId, nombre: data.nombre})

        nodos.forEach(nodoObj => {
            nodoObj.socket.emit('actualizacion-red', {nodos: nodos.map(n => n.getInfo(true))})
        })
    });

    socket.on('peso-vecino', (data) => {
        console.log('peso vecino ', data)
        const { idNodo1, idNodo2, peso } = data;

        let indexNodo1 = -1;
        let indexNodo2 = -1;

        nodos.forEach((nodo, index) => {
            if (nodo.id === idNodo1) {
                indexNodo1 = index;
            }

            if (nodo.id === idNodo2) {
                indexNodo2 = index
            }
        })

        if (indexNodo1 !== -1 && indexNodo2 !== -1 && indexNodo1 !== indexNodo2) {
            const nodo1 = nodos[indexNodo1];
            const nodo2 = nodos[indexNodo2];

            if (0 < peso) {
                nodo1.addVecino(nodo2); // Funcion ya esta programado que si ya tiene ese nodo como vecino no lo vuelve a agregar
                nodo1.setVecinoPeso(idNodo2, peso);
    
                nodo2.addVecino(nodo1);
                nodo2.setVecinoPeso(idNodo1, peso);
            } else {
                nodo1.deleteVecino(nodo2.id);
                nodo2.deleteVecino(nodo1.id);
            }


            nodos.forEach(nodoObj => {
                nodoObj.socket.emit('actualizacion-red', {nodos: nodos.map(n => n.getInfo(true))})
            })
        } else {
            socket.emit('error-msj', {mensaje: "Alguno de los id son inválidos o son iguales."})
        }
    })

    socket.on('send-message', (data) => {
        console.log("send-message ", data);
        const { idNodoDestino, idNodoOrigen, idNodoDestinoFinal, mensaje } = data;
        
        let nodoDestinoIndex = -1;

        nodos.forEach((nodo, index) => {
            if (nodo.id === idNodoDestino) {
                nodoDestinoIndex = index;
            }
        })

        if (nodoDestinoIndex !== -1) {
            const nodoDestino = nodos[nodoDestinoIndex];

            nodoDestino.socket.emit('receive-message', {
                idNodoOrigen: idNodoOrigen, // Id del nodo origen
                idNodoDesde: clientId, // Id del nodo que esta enviando el mensaje
                idNodoDestinoFinal: idNodoDestinoFinal, // Id del nodo destino final
                mensaje: mensaje, // Mensaje que se le quiere enviar
                extra: data.extra !== undefined ? data.extra : undefined // Cualquier cosa que se desea pasar al receptor
            })
        } else {
            socket.emit('error-msj', {mensaje: "El id del nodo destino no existe."})
        }
    })

    socket.on('disconnect', () => {
        console.log("disconnected");
        let nodoIndex = -1;
        nodos.forEach((nodo, index) => {
            nodo.deleteVecino(clientId);
            
            if (nodo.id === clientId) {
                nodoIndex = index;
            }
        })

        if (nodoIndex !== -1) {
            nodos.splice(nodoIndex, 1);
    
            nodos.forEach(nodoObj => {
                nodoObj.socket.emit('actualizacion-red', {nodos: nodos.map(n => n.getInfo(true))})
            })
        }

    })
});