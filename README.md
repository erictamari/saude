# Mix Chicken Gestão Pro

Versão profissional inicial do sistema de gestão do Mix Chicken, preparada para GitHub Pages e uso em celular.

## Módulos
Dashboard, Vendas, Financeiro, Compras, Insumos, Estoque, Fichas Técnicas, Produtos, Relatórios e Configurações.

## Recursos principais
- Interface desktop e mobile responsiva.
- Navegação inferior no celular.
- Registro de vendas com baixa automática dos ingredientes da ficha técnica.
- Compras atualizam estoque e preço do insumo.
- Fichas técnicas calculam custo, CMV e markup.
- Dashboard com indicadores e gráficos.
- Backup e restauração JSON.
- Dados persistidos no navegador.

## Próxima etapa para produção
Para vários usuários/dispositivos, recomenda-se migrar o armazenamento para banco de dados com autenticação, API, permissões e auditoria. Também é recomendável separar CMV teórico de CMV contábil pelo método estoque inicial + compras - estoque final.
