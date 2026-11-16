import app from '../src/app.js';
import request from 'supertest';
import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDatabase } from './utils/clearDatabase.js';
import { MontadoraFactory } from './factories/MontadoraFactory.js';
import { ClienteFactory } from './factories/ClienteFactory.js';
import { VeiculoFactory } from './factories/VeiculoFactory.js';

// Mock do axios: evita chamadas reais ao ViaCEP (consultarCep usa axios.get)
vi.mock('axios', () => ({
    default: { get: vi.fn() }
}));

const respostaViaCep = (extra = {}) => ({
    data: {
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
        ...extra
    }
});

describe('API de montadoras', () => {
    beforeEach(async () => {
        await MontadoraFactory.create('Toyota', 'Japão');
        await MontadoraFactory.create('Honda', 'Japão');
        await MontadoraFactory.create('Ford', 'USA');

        vi.clearAllMocks();
    });

    afterEach(async () => {
        await clearDatabase();

        vi.resetAllMocks();
    });

    describe('Criação de Montadoras', () => {
        it('Deve criar uma montadora com sucesso.', async () => {
            const response = await request(app).post('/montadoras').send({
                nome: 'Hyundai',
                pais: 'Coréia do Sul'
            });

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('insertId');
        });

        it('Deve recusar criar uma montadora com nome impossível (Indefinido).', async () => {
            const response = await request(app).post('/montadoras').send({
                nome: undefined,
                pais: 'Coréia do Sul'
            });

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });

        it('Deve recusar criar uma montadora com nome impossível (Menor).', async () => {
            const response = await request(app).post('/montadoras').send({
                nome: 'Ac',
                pais: 'Coréia do Sul'
            });

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });

        it('Deve recusar criar uma montadora com nome impossível (Maior).', async () => {
            const response = await request(app).post('/montadoras').send({
                nome: 'Acaifdbufdibfibsdifbsdfsdbfudbsfhybsfbdusbfsdubfhudsbfuhsdbfusdbfubsdfu',
                pais: 'Coréia do Sul'
            });

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });

        it('Deve recusar criar uma montadora com país impossível (Indefinido).', async () => {
            const response = await request(app).post('/montadoras').send({
                nome: 'Hyundai',
                pais: undefined
            });

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });

        it('Deve recusar criar uma montadora com país impossível (Menor).', async () => {
            const response = await request(app).post('/montadoras').send({
                nome: 'Hyundai',
                pais: 'a'
            });

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });

        it('Deve recusar criar uma montadora com país impossível (Maior).', async () => {
            const response = await request(app).post('/montadoras').send({
                nome: 'Hyundai',
                pais: 'aadbsaudbsauvdvsadvsadvusavduvasdusadvsauvdusadvuvsdavdvdasvdvsdauvsdayuvsaduyvsdauvasduvsdauvsdauvdsauvsdauvsdavadu'
            });

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Exclusão de Montadoras', () => {
        it('Deve excluir um registro de montadora com sucesso', async () => {
            const montadora = await MontadoraFactory.create('Hyundai', 'Coréia do Sul');
            const response = await request(app).delete(`/montadoras/${montadora.id}`);
            expect(response.status).toBe(200);
        });

        it('Deve falhar ao excluir um registro de montadora (Id Indefinido)', async () => {
            const montadora = await MontadoraFactory.create('Hyundai', 'Coréia do Sul');
            const response = await request(app).delete(`/montadoras/${montadora.id + 1}`);
            expect(response.status).toBe(404);
        });

        it('Deve falhar ao excluir um registro de montadora (Id NaN)', async () => {
            const response = await request(app).delete(`/montadoras/A`);
            expect(response.status).toBe(404);
        });

        it('Deve falhar ao excluir um registro de montadora (Id <= 0)', async () => {
            const response = await request(app).delete(`/montadoras/${-1}`);
            expect(response.status).toBe(404);
        });

        it('Deve falhar ao excluir um registro de montadora (Id inexistente no banco)', async () => {
            const response = await request(app).delete(`/montadoras/8000`);
            expect(response.status).toBe(404);
        });
    });

    describe('Seleção de Montadoras', () => {
        it('Deve selecionar as montadoras de forma bem sucedida.', async () => {
            const response = await request(app).get('/montadoras');
            expect(response.status).toBe(200);
        });

        // NOVO 1
        it('Deve listar as montadoras cadastradas ordenadas por nome.', async () => {
            const response = await request(app).get('/montadoras');

            expect(response.status).toBe(200);
            expect(response.body.data.map((m) => m.Nome)).toEqual(['Ford', 'Honda', 'Toyota']);
        });
    });

    describe('Atualização de Montadoras', () => {
        it('Deve atualizar uma montadora de forma bem sucedida.', async () => {
            const montadora = await MontadoraFactory.create('Hyundai', 'Coréia do Sul');
            // O controller lê o id de req.query.id (e não do body)
            const response = await request(app).put(`/montadoras?id=${montadora.id}`).send({
                nome: 'Tesla',
                pais: 'USA'
            });
            expect(response.status).toBe(200);
        });

        // NOVO 2
        it('Deve retornar 404 ao atualizar uma montadora inexistente.', async () => {
            const response = await request(app).put('/montadoras?id=8000').send({
                nome: 'Tesla',
                pais: 'USA'
            });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Montadora não encontrada');
        });
    });
});

describe('API de clientes', () => {
    afterEach(async () => {
        await clearDatabase();

        vi.resetAllMocks();
    });

    // NOVO 3
    it('Deve criar um cliente limpando o CPF e preenchendo o endereço pelo CEP.', async () => {
        axios.get.mockResolvedValue(respostaViaCep());

        const response = await request(app).post('/clientes').send({
            nome: 'Maria Silva',
            cpf: '123.456.789-09',
            cep: '01310-100',
            numero: '1000',
            complemento: 'Apto 12'
        });

        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('insertId');
        expect(axios.get).toHaveBeenCalledWith('https://viacep.com.br/ws/01310100/json/');

        const lista = await request(app).get('/clientes');
        expect(lista.body.data).toHaveLength(1);
        expect(lista.body.data[0]).toMatchObject({
            Nome: 'Maria Silva',
            CPF: '12345678909',
            CEP: '01310100',
            Logradouro: 'Avenida Paulista',
            Bairro: 'Bela Vista',
            Cidade: 'São Paulo',
            UF: 'SP',
            Numero: '1000',
            Complemento: 'Apto 12'
        });
    });

    // NOVO 4
    it('Deve recusar criar um cliente com CEP não encontrado e não gravar nada.', async () => {
        axios.get.mockResolvedValue({ data: { erro: true } });

        const response = await request(app).post('/clientes').send({
            nome: 'Maria Silva',
            cpf: '12345678909',
            cep: '99999999',
            numero: '10'
        });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('CEP não encontrado');

        const lista = await request(app).get('/clientes');
        expect(lista.body.data).toHaveLength(0);
    });

    // NOVO 5
    it('Deve listar os clientes ordenados por nome.', async () => {
        await ClienteFactory.create('Zeca Souza', '11111111111', '01310100', 'Avenida Paulista', 'Bela Vista', 'São Paulo', 'SP', '1');
        await ClienteFactory.create('Ana Lima', '22222222222', '01310100', 'Avenida Paulista', 'Bela Vista', 'São Paulo', 'SP', '2');
        await ClienteFactory.create('Bruno Alves', '33333333333', '01310100', 'Avenida Paulista', 'Bela Vista', 'São Paulo', 'SP', '3');

        const response = await request(app).get('/clientes');

        expect(response.status).toBe(200);
        expect(response.body.data.map((c) => c.Nome)).toEqual(['Ana Lima', 'Bruno Alves', 'Zeca Souza']);
    });

    // NOVO 6
    it('Deve impedir a exclusão de um cliente que possui veículo vinculado (FK RESTRICT).', async () => {
        const montadora = await MontadoraFactory.create('Toyota', 'Japão');
        const cliente = await ClienteFactory.create('Maria Silva', '12345678909', '01310100', 'Avenida Paulista', 'Bela Vista', 'São Paulo', 'SP', '1000');
        await VeiculoFactory.create('Corolla', 'ABC1D23', 2022, 'Prata', 85000, cliente.id, montadora.id);

        const response = await request(app).delete(`/clientes/${cliente.id}`);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');

        const lista = await request(app).get('/clientes');
        expect(lista.body.data).toHaveLength(1);
    });
});

describe('API de veículos', () => {
    let montadora;
    let cliente;

    beforeEach(async () => {
        montadora = await MontadoraFactory.create('Toyota', 'Japão');
        cliente = await ClienteFactory.create('Maria Silva', '12345678909', '01310100', 'Avenida Paulista', 'Bela Vista', 'São Paulo', 'SP', '1000');
    });

    afterEach(async () => {
        await clearDatabase();

        vi.resetAllMocks();
    });

    // NOVO 7
    it('Deve criar um veículo com sucesso.', async () => {
        const response = await request(app).post('/veiculos').send({
            idMontadora: montadora.id,
            idCliente: cliente.id,
            modelo: 'Corolla',
            placa: 'ABC1D23',
            ano: 2022,
            cor: 'Prata',
            valor: 85000
        });

        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('insertId');

        const lista = await request(app).get('/veiculos');
        expect(lista.body.data).toHaveLength(1);
        expect(lista.body.data[0]).toMatchObject({ Modelo: 'Corolla', Placa: 'ABC1D23', Ano: 2022, Cor: 'Prata' });
    });

    // NOVO 8
    it('Deve recusar criar um veículo com montadora inexistente (FK).', async () => {
        const response = await request(app).post('/veiculos').send({
            idMontadora: montadora.id + 1000,
            idCliente: cliente.id,
            modelo: 'Corolla',
            placa: 'ABC1D23',
            ano: 2022,
            cor: 'Prata',
            valor: 85000
        });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');

        const lista = await request(app).get('/veiculos');
        expect(lista.body.data).toHaveLength(0);
    });

    // NOVO 9
    it('Deve listar os veículos trazendo o nome da montadora e do cliente (JOIN).', async () => {
        await VeiculoFactory.create('Corolla', 'ABC1D23', 2022, 'Prata', 85000, cliente.id, montadora.id);

        const response = await request(app).get('/veiculos');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toMatchObject({
            IdMontadora: montadora.id,
            IdCliente: cliente.id,
            Montadora: 'Toyota',
            Cliente: 'Maria Silva',
            Modelo: 'Corolla'
        });
        expect(Number(response.body.data[0].Valor)).toBe(85000);
    });

    // NOVO 10
    it('Deve atualizar a cor e o valor de um veículo existente.', async () => {
        const veiculo = await VeiculoFactory.create('Corolla', 'ABC1D23', 2022, 'Prata', 85000, cliente.id, montadora.id);

        const response = await request(app).put(`/veiculos?id=${veiculo.id}`).send({
            idMontadora: montadora.id,
            idCliente: cliente.id,
            modelo: 'Corolla',
            placa: 'ABC1D23',
            ano: 2022,
            cor: 'Preto',
            valor: 90000
        });

        expect(response.status).toBe(200);

        const lista = await request(app).get('/veiculos');
        expect(lista.body.data[0].Cor).toBe('Preto');
        expect(Number(lista.body.data[0].Valor)).toBe(90000);
    });
});
