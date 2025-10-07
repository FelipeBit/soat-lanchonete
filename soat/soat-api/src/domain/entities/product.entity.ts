export enum ProductCategory {
  BURGER = 'BURGER',
  SIDE_DISH = 'SIDE_DISH',
  BEVERAGE = 'BEVERAGE',
  DESSERT = 'DESSERT',
}

export class Product {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly description: string,
    private readonly price: number,
    private readonly category: ProductCategory,
    private readonly imageUrl?: string,
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getPrice(): number {
    return this.price;
  }

  getCategory(): ProductCategory {
    return this.category;
  }

  getImageUrl(): string | undefined {
    return this.imageUrl;
  }
}
