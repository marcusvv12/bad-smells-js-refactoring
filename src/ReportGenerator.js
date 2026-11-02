export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo.
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    let report = '';
    let total = 0;

    // --- Seção do Cabeçalho ---
    if (reportType === 'CSV') {
      report += 'ID,NOME,VALOR,USUARIO\n';
    } else if (reportType === 'HTML') {
      report += '<html><body>\n';
      report += '<h1>Relatório</h1>\n';
      report += `<h2>Usuário: ${user.name}</h2>\n`;
      report += '<table>\n';
      report += '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n';
    }

    // --- Seção do Corpo (Alta Complexidade) ---
    for (const item of items) {
      if (user.role === 'ADMIN') {
        // Admins veem todos os itens
        if (item.value > 1000) {
          // Lógica bônus para admins
          item.priority = true;
        }

        if (reportType === 'CSV') {
          report += `${item.id},${item.name},${item.value},${user.name}\n`;
          total += item.value;
        } else if (reportType === 'HTML') {
          const style = item.priority ? ' style="font-weight:bold;"' : '';
          report += `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
          total += item.value;
        }
      } else if (user.role === 'USER') {
        // Users comuns só veem itens de valor baixo
        if (item.value <= 500) {
          if (reportType === 'CSV') {
            report += `${item.id},${item.name},${item.value},${user.name}\n`;
            total += item.value;
          } else if (reportType === 'HTML') {
            report += `<tr><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
            total += item.value;
          }
        }
      }
    }

    // --- Seção do Rodapé ---
    if (reportType === 'CSV') {
      report += '\nTotal,,\n';
      report += `${total},,\n`;
    } else if (reportType === 'HTML') {
      report += '</table>\n';
      report += `<h3>Total: ${total}</h3>\n`;
      report += '</body></html>\n';
    }

    return report.trim();
  }
}