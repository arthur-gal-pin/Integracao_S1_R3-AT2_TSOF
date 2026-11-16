import { connection } from "../../src/configs/Database.js";

export default async function clearDatabase() {
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');

  await connection.query('DELETE FROM veiculos WHERE 1=1');
  await connection.query('DELETE FROM clientes WHERE 1=1');
  await connection.query('DELETE FROM montadoras WHERE 1=1');

  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
};