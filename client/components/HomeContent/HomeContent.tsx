import { fetchHomeContent } from '@/lib/api';

export default async function HomeContent() {
  const HomePageData = await fetchHomeContent();
  console.log(HomePageData);
  return (
    <p>this is sakar</p>
  );
}
