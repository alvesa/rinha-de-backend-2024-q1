using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Repositories;
using rinha_backend_api.IoC.Entities;

namespace rinha_backend_api.IoC.Repositories
{
    public interface IExtratoRepository
    {
        public AccountEntity MakeTransacao();
    }
}