// Regras de negócio que antes eram "números mágicos" espalhados no código.
const ADMIN_PRIORITY_THRESHOLD = 1000;
const USER_MAX_VISIBLE_VALUE = 500;

// --- Formatos de relatório (Replace Conditional with Polymorphism) ---
// Cada formato sabe montar seu próprio cabeçalho, linha e rodapé,
// eliminando os if/else de reportType repetidos em cada seção.

class CsvFormatter {
  header() {
    return 'ID,NOME,VALOR,USUARIO\n';
  }

  row(item, user) {
    return `${item.id},${item.name},${item.value},${user.name}\n`;
  }

  footer(total) {
    return `\nTotal,,\n${total},,\n`;
  }
}

class HtmlFormatter {
  header(user) {
    return [
      '<html><body>',
      '<h1>Relatório</h1>',
      `<h2>Usuário: ${user.name}</h2>`,
      '<table>',
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>',
    ].join('\n') + '\n';
  }

  row(item, _user, highlighted) {
    const style = highlighted ? ' style="font-weight:bold;"' : '';
    return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  }

  footer(total) {
    return `</table>\n<h3>Total: ${total}</h3>\n</body></html>\n`;
  }
}

// --- Regras de visibilidade por perfil (Replace Conditional with Polymorphism) ---
// A classe base funciona como Null Object: perfis desconhecidos não veem nenhum item.

class RolePolicy {
  canSee() {
    return false;
  }

  prepare() {
    // Por padrão, nenhum ajuste é feito no item.
  }

  isHighlighted() {
    return false;
  }
}

class AdminPolicy extends RolePolicy {
  canSee() {
    return true;
  }

  prepare(item) {
    if (item.value > ADMIN_PRIORITY_THRESHOLD) {
      item.priority = true;
    }
  }

  isHighlighted(item) {
    return Boolean(item.priority);
  }
}

class StandardUserPolicy extends RolePolicy {
  canSee(item) {
    return item.value <= USER_MAX_VISIBLE_VALUE;
  }
}

const FORMATTERS = new Map([
  ['CSV', new CsvFormatter()],
  ['HTML', new HtmlFormatter()],
]);

const ROLE_POLICIES = new Map([
  ['ADMIN', new AdminPolicy()],
  ['USER', new StandardUserPolicy()],
]);

const NO_ACCESS_POLICY = new RolePolicy();

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
    const policy = ROLE_POLICIES.get(user.role) ?? NO_ACCESS_POLICY;
    const visibleItems = this.#selectVisibleItems(items, policy);

    const formatter = FORMATTERS.get(reportType);
    if (!formatter) {
      return '';
    }

    const report =
      formatter.header(user) +
      this.#buildBody(formatter, policy, user, visibleItems) +
      formatter.footer(this.#sumValues(visibleItems));

    return report.trim();
  }

  #selectVisibleItems(items, policy) {
    const visibleItems = items.filter((item) => policy.canSee(item));
    visibleItems.forEach((item) => policy.prepare(item));
    return visibleItems;
  }

  #buildBody(formatter, policy, user, items) {
    return items
      .map((item) => formatter.row(item, user, policy.isHighlighted(item)))
      .join('');
  }

  #sumValues(items) {
    return items.reduce((total, item) => total + item.value, 0);
  }
}
