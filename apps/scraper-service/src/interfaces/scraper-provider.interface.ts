export interface RawListing {
  title: string;
  productUrl: string;
}

export interface RawProductDetail {
  title: string;
  price: number;
  imageUrls: string[];
  description?: string;
  inStock: boolean;
  sourceUrl: string;
}

export interface ScraperProvider {
  /**
   * Unique name of the provider (e.g., 'JakartaNotebook')
   */
  readonly name: string;

  /**
   * Base URL of the provider
   */
  readonly baseUrl: string;

  /**
   * Scrapes a list of products from a category or search page
   * @param url The URL to scrape listings from
   */
  scrapeListing(url: string): Promise<RawListing[]>;

  /**
   * Scrapes the detailed information of a single product
   * @param url The product detail URL
   */
  scrapeDetail(url: string): Promise<RawProductDetail | null>;
}
