import React from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { queryKeys } from '../../services/queryKeys';

export interface ProductFallbackRedirectProps {
  toSection: 'validation' | 'competitors' | 'change-tracker' | 'reports';
}

export const ProductFallbackRedirect: React.FC<ProductFallbackRedirectProps> = ({
  toSection,
}) => {
  const ctx = useOutletContext<{ selectedProductId?: string }>();
  const { data: productsData, isLoading } = useQuery({
    queryKey: queryKeys.products.list(),
    queryFn: () => api.products.list({ limit: 20 }),
  });

  const products = productsData?.items || [];
  const productId = ctx?.selectedProductId || (products.length > 0 ? products[0].id : undefined);

  if (isLoading && !productId) {
    return null;
  }

  if (productId) {
    return <Navigate to={`/${toSection}/${productId}`} replace />;
  }

  // Redirect to "/" only when there are no analyses at all
  return <Navigate to="/" replace />;
};
