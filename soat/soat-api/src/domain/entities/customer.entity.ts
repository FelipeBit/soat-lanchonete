export class Customer {
  constructor(
    private readonly id: string,
    private readonly name: string | null,
    private readonly cpf: string | null,
    private readonly email: string | null,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getCPF(): string | null {
    return this.cpf;
  }

  getEmail(): string | null {
    return this.email;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
