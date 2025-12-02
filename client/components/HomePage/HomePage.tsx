import { fetchHomeContent } from '@/lib/api';

export default async function HomePage() {
  const HomePageData = await fetchHomeContent();
  console.log(HomePageData);
  return (
    <p>{HomePageData.content}</p>
  );
}
