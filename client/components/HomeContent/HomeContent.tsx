import { fetchGlobalData, fetchHomeContent } from '@/lib/api';
import { IMAGE_URL } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import PrimaryButton from '../Buttons/PrimaryButton/PrimaryButton';

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
  const GlobalData = await fetchGlobalData();

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
            <h1 className='capitalize text-left!' dangerouslySetInnerHTML={{ __html: HomePageData?.title || '' }} />
          </div>
          <article dangerouslySetInnerHTML={{ __html: HomePageData?.content || '' }} />
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
                  <h2
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
          <ul className='mt-6 flex flex-wrap items-center gap-6'>
            <li>
              <PrimaryButton href='/about-us'>
                Read more
              </PrimaryButton>
            </li>
            <li className='flex items-center gap-2'>
              <Link
                href={`https://wa.me/977${GlobalData.mobileNumber1}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="icon h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                  <svg
                    className="icon text-white shrink-0 pt-1"
                    width="26"
                    height="26"
                  >
                    <use
                      xlinkHref={`/icons.svg#call-us-now`}
                      fill="currentColor"
                    ></use>
                  </svg>
                </div>
                <div className="call-us-now-body">
                  <span className='block leading-[100%] text-sm font-medium text-primary'>Call Us Now</span>
                  <span className='block text-headings leading-[100%] mt-1 font-semibold text-base md:text-[1.125rem] tracking-[0.5px]'>+977 {GlobalData.mobileNumber1}</span>
                </div>
              </Link>
            </li>

          </ul>

        </div>
        <div className="image-container hidden lg:block relative">
          <figure className='image-slot aspect-613/657 w-full h-full rounded-lg'>
            <Image
              src={HomePageData?.bannerImage ? `${IMAGE_URL}${HomePageData.bannerImage}` : '/placeholder.jpg'}
              alt={HomePageData?.bannerImageAlt || 'Banner Image'}
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
