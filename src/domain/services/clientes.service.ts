import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  TransacaoRequest,
  TransacaoResponse,
} from 'src/controllers/clientes.controller';
import { Clientes } from 'src/infra/entities/clientes.entity';
import { ClientesRepository } from 'src/infra/repositories/clientes.respository';
import { TransacoesRepository } from 'src/infra/repositories/transacoes.respository';
import { ExtratoResposta } from '../dto/extrato.dto';

@Injectable()
export class ClientesService {
  constructor(
    private readonly clientesRepository: ClientesRepository,
    private readonly transacoesRepository: TransacoesRepository,
  ) {}
  async extrato(id: number): Promise<any> {
    const result = new ExtratoResposta();

    const cliente = await this.getClienteById(id);

    result.saldo = {
      data_extrato: new Date(),
      limite: cliente.limite,
      total: cliente.saldo,
    };

    const ultimas = await this.transacoesRepository.findLastTransactions(id);

    result.ultimas_transacoes = [];

    for (const ultima of ultimas) {
      result.ultimas_transacoes.push({
        descricao: ultima.descricao,
        realizada_em: ultima.realizadaEm,
        tipo: ultima.tipo,
        valor: ultima.valor,
      });
    }

    return result;
  }

  async transacao(
    clienteId: number,
    request: TransacaoRequest,
  ): Promise<TransacaoResponse> {
    const cliente = await this.getClienteById(clienteId);

    const saldoAtual = request.valor * -1 + cliente.saldo;

    switch (request.tipo) {
      case 'd':
        if (saldoAtual < cliente.limite * -1)
          throw new UnprocessableEntityException();

        cliente.saldo -= request.valor;
        break;
      case 'c':
        cliente.saldo += request.valor;
        break;
    }

    await this.transacoesRepository.create({
      valor: request.valor,
      clienteId: cliente.clienteId,
      tipo: request.tipo,
      descricao: request.descricao,
      realizadaEm: new Date(),
    });

    await this.clientesRepository.create(cliente);

    return {
      limite: cliente.limite,
      saldo: cliente.saldo,
    };
  }

  private async getClienteById(clienteId: number): Promise<Clientes> {
    const cliente = await this.clientesRepository.findById(clienteId);

    if (!cliente) throw new NotFoundException();

    return cliente;
  }
}
