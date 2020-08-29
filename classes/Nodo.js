
module.exports = class Nodo {
    id = ""
    nombre = ""
    vecinos = []
    socket = {}

    /**
     * @param {string} id - El id del nodo
     */
    constructor(id, nombre, socket) {
        this.id = id;
        this.nombre = nombre
        this.socket = socket;
    }

    getInfo = (isVecinos) => {
        return {
            id: this.id,
            nombre: this.nombre,
            vecinos: isVecinos ? this.vecinos.map(vecino => ({nodo: vecino.nodo.getInfo(false), peso: vecino.peso})) : undefined,
        }
    }

    /**
     * @param {Nodo} nodo - El nodo vecino
     */
    addVecino = (nodo) => {
        let nodoExiste = false;

        this.vecinos.forEach(vecino => {
            if (vecino.nodo.id === nodo.id) {
                nodoExiste = true;
            }
        })

        if (nodo.id !== this.id && !nodoExiste) {
            this.vecinos.push({nodo: nodo, peso: 0})
        }
    }

    /**
     * @param {string} nodoId - El id del nodo
     * @param {int} peso - El el peso entre los vecinos
     */
    setVecinoPeso = (nodoId, peso) => {
        this.vecinos.forEach((vecino, index) => {
            if(vecino.nodo.id === nodoId) {
                this.vecinos[index].peso = peso;
            }
        })
    }

    /**
     * @param {string} nodoId - El id del nodo
     */
    deleteVecino = (nodoId) => {
        let nodoIndex = -1;

        this.vecinos.forEach((vecino, index) => {
            if (vecino.nodo.id === nodoId) {
                nodoIndex = index;
            }
        })

        this.vecinos.splice(nodoIndex, 1);
    }
}