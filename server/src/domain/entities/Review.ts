export interface ReviewEntity {
  id: string;
  userId: string;
  productId: string;
  orderId: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  sellerResponse?: {
    comment: string;
    respondedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
