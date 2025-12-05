import { fetchHomeContent } from '@/lib/api';
import { IMAGE_URL } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';

interface HomeContentProps {
  pretitle?: string;
}

const services = [
  {
    title: "Best Price Guarantee",
    body: "As a trusted local operator, we offer the best prices with no hidden fees, giving you more value for your journey.",
    icon: "bestprice"
  },
  {
    title: "Sustainable Tours",
    body: "We promote eco-friendly travel and empower local communities, ensuring your visit supports nature and the people.",
    icon: "sustainabletour"
  },
  {
    title: "Customer Care 24/7",
    body: "Our team is available around the clock to assist you, making sure your questions are answered anytime you need.",
    icon: "customercare"
  },
  {
    title: "Easy Tour Boking",
    body: "With our smooth and simple booking system, planning your ideal adventure becomes quick, easy, and stress-free.",
    icon: "easybooking"
  }
];


export default async function HomeContent({ pretitle }: HomeContentProps) {
  const HomePageData = await fetchHomeContent();
  console.log(HomePageData);
  return (
    <div className='home-content common-box pt-0'>
      <div className="container grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="home-content-body col-span-2 lg:col-span-1">
          <div className="title">
            {pretitle && <span className='justify-start!'>
              <svg
                className="icon text-primary"
                width="36"
                height="26.4"
              >
                <use
                  xlinkHref="/icons.svg#company-logo"
                  fill="currentColor"
                ></use>
              </svg>
              {pretitle}</span>}
            <h1 className='capitalize text-left!' dangerouslySetInnerHTML={{ __html: HomePageData?.title }} />
          </div>
          <article dangerouslySetInnerHTML={{ __html: HomePageData?.content }} />
          <ul className="sercives grid grid-cols-1 md:grid-cols-2 mt-6 [&>*]:bg-primary/5 [&>*:first-child]:rounded-tl-lg [&>*:first-child]:bg-primary/15 [&>*:nth-child(2)]:rounded-tr-lg [&>*:nth-child(3)]:rounded-bl-lg [&>*:last-child]:bg-primary/15 [&>*:last-child]:rounded-br-lg">

            {services.map((service, index) => (
              <li key={index} className="service-item flex gap-2.5 p-8 md:p-4">
                <svg
                  className="icon text-primary shrink-0 pt-1"
                  width="40"
                  height="40"
                >
                  <use
                    xlinkHref={`/icons.svg#${service.icon}`}
                    fill="currentColor"
                  ></use>
                </svg>

                <div className="service-body">
                  <h3
                    className="capitalize text-xl font-semibold text-headings"
                    dangerouslySetInnerHTML={{ __html: service.title }}
                  />
                  <p
                    className="text-sm leading-[150%] mt-1 text-body-text/85"
                    dangerouslySetInnerHTML={{ __html: service.body }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <ul className='mt-6'>
            {/* <li>
              <Link className="py-2 px-5 md:py-3 relative z-10 md:px-6 md:text-md text-sm bg-primary inline-block border-primary rounded-full text-white font-bold leading-[1] shadow-[1px_2px_#143254] hover:bg-primary-100" href="/about-us">Read more about us</Link>
            </li> */}
            <li>
              <Link href='#' className="relative group cursor-pointer text-white  overflow-hidden h-10.5 w-50 rounded-full bg-[#0068a7] p-2 flex justify-center items-center font-semibold">
                <div className="absolute top-3 right-20 group-hover:top-12 group-hover:-right-8 z-10 w-32 h-32 rounded-full group-hover:scale-150 group-hover:opacity-50 duration-500 bg-[#3785c9]"></div>
                <div className="absolute top-3 right-20 group-hover:top-12 group-hover:-right-8 z-10 w-24 h-24 rounded-full group-hover:scale-150 group-hover:opacity-50 duration-500 bg-[#4592da]"></div>
                <p className="z-10">Read more</p>
              </Link>

            </li>

          </ul>

        </div>
        <div className="image-container hidden lg:block relative">
          <figure className='image-slot aspect-613/657 w-full h-full rounded-lg'>
            <Image
              src={HomePageData?.bannerImage ? `${IMAGE_URL}${HomePageData.bannerImage}` : '/placeholder.jpg'}
              alt={HomePageData?.bannerImageAlt || HomePageData?.bannerImageAlt || 'Banner Image'}
              className='bg-page-body object-fill rounded-lg'
              fill
            />
          </figure>
          <figcaption className="bg-primary/90 w-fit text-white flex items-center justify-center gap-2 py-2 px-3 absolute top-20 rounded-l-[12px] border-4 border-r-0 border-page-body right-0 z-10"><span className="text-[35px] leading-1 font-semibold">05</span><span className="text-semibold text-[15px] leading-[18px]">Years of <br /> experience</span></figcaption>
        </div>
      </div>
    </div>
  );
}
