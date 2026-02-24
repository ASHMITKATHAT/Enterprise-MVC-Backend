export class Service {
  private items: any[] = [];

  async findAll(): Promise<any[]> { return this.items; }
  async findById(id: string): Promise<any | null> { return this.items.find(i => i.id === id) || null; }
  async create(data: any): Promise<any> { this.items.push(data); return data; }
  async update(id: string, data: any): Promise<any | null> { const idx = this.items.findIndex(i => i.id === id); if (idx >= 0) { this.items[idx] = { ...this.items[idx], ...data }; return this.items[idx]; } return null; }
  async delete(id: string): Promise<boolean> { const idx = this.items.findIndex(i => i.id === id); if (idx >= 0) { this.items.splice(idx, 1); return true; } return false; }
}
