import { Request, Response } from 'express';

export class Controller {
  async getAll(req: Request, res: Response) {
    res.json({ data: [], page: 1, total: 0 });
  }

  async getById(req: Request, res: Response) {
    res.json({ id: req.params.id, data: null });
  }

  async create(req: Request, res: Response) {
    res.status(201).json({ data: req.body });
  }
}
