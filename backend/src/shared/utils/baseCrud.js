// utils/baseCrud.js
export class BaseCrud {
  constructor(model) {
    this.model = model;
  }

  // Pagination helper
  static paginate(page = 1, limit = 10) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, parseInt(limit, 10) || 10);

    return {
      limit: safeLimit,
      offset: (safePage - 1) * safeLimit,
      page: safePage,
    };
  }

  //  CREATE
  create(data) {
    return this.model.create(data);
  }

  //  READ ALL with pagination
  async getAll(page = 1, limit = 10, options = {}) {
    const { limit: l, offset, page: safePage } = BaseCrud.paginate(page, limit);

    const { rows, count } = await this.model.findAndCountAll({
      limit: l,
      offset,
      order: [["createdAt", "DESC"]],
      ...options, // allow filters, includes, etc.
    });

    return {
      data: rows,
      total: count,
      page: safePage,
      limit: l,
      totalPages: Math.ceil(count / l),
    };
  }

  //  READ ONE
  getById(id, options = {}) {
    return this.model.findByPk(id, options);
  }

  //  UPDATE
  async update(id, data) {
    const item = await this.model.findByPk(id);
    if (!item) return null;
    return item.update(data);
  }

  //  SOFT DELETE (requires model with `paranoid: true`)
  async softDelete(id, userData = {}) {
    const item = await this.model.findByPk(id);
    if (!item) return null;
    
    // Update with user data before soft delete
    if (userData.deletedBy) {
      await item.update({ deletedBy: userData.deletedBy });
    }
    
    await item.destroy(); // Sequelize will set deletedAt instead of removing
    return item;
  }

  //  RESTORE (undo soft delete)
  async restore(id) {
    if (!this.model.restore) {
      throw new Error("Restore not supported — enable paranoid mode in model");
    }
    const item = await this.model.findByPk(id, { paranoid: false });
    if (!item) return null;
    await item.restore();
    return item;
  }

  //  HARD DELETE (permanent)
  async hardDelete(id) {
    const item = await this.model.findByPk(id, { paranoid: false });
    if (!item) return null;
    await item.destroy({ force: true }); // bypas
    return item;
  }
}
