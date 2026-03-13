import { getProduct, getAffiliateUrl } from "@/lib/affiliates";

interface InlineLinkProps {
  productId: string;
  program?: string;
  children?: React.ReactNode;
  className?: string;
}

export function InlineLink({
  productId,
  program,
  children,
  className,
}: InlineLinkProps) {
  const product = getProduct(productId);
  if (!product) return null;

  const url = getAffiliateUrl(productId, program);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="nofollow sponsored"
      className={className}
    >
      {children || product.name}
    </a>
  );
}
