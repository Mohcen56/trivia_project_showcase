import CategoriesList from './CategoriesList';

// Client-side fetch - auth token is attached via API proxy from HttpOnly cookie
export default function CategoriesPage() {
  return <CategoriesList initialData={null} />;
}