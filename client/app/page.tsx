'use client';

import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { Button } from '@/components/Button';
import Link from 'next/link';
import { ArrowRight, Calendar, Star, Quote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchFeaturedPackages, fetchFeaturedBlogs, fetchFeaturedTestimonials, Package, Blog, Testimonial } from '@/lib/api';

// Types imported from lib/api.ts

export default function Home() {
  const [featuredPackages, setFeaturedPackages] = useState<Package[]>([]);
  const [featuredBlogs, setFeaturedBlogs] = useState<Blog[]>([]);
  const [featuredTestimonials, setFeaturedTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packagesData, blogsData, testimonialsData] = await Promise.all([
          fetchFeaturedPackages(),
          fetchFeaturedBlogs(),
          fetchFeaturedTestimonials()
        ]);

        // API helpers return arrays directly
        setFeaturedPackages(packagesData);
        setFeaturedBlogs(blogsData);
        setFeaturedTestimonials(testimonialsData);



      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gray-900/60 z-10"></div>
          <div
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2021&q=80")' }}
          ></div>

          <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Explore the World with <span className="text-primary">Confidence</span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Discover breathtaking destinations, unique cultures, and unforgettable experiences. Your next adventure starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/packages">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-full">
                  Find Your Trip
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 px-8 py-6 text-lg rounded-full">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Packages */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Destinations</h2>
              <p className="text-gray-600 max-w-2xl">
                Our most exclusive and top-rated packages, handpicked for you.
              </p>
            </div>
            <Link href="/packages" className="hidden md:flex items-center text-primary font-medium hover:underline">
              View all packages <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-[400px] animate-pulse"></div>
              ))
            ) : featuredPackages.length > 0 ? (
              featuredPackages.map((pkg) => (
                <div key={pkg.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={pkg.featuredImage || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-gray-900">
                      ${pkg.defaultPrice}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{pkg.duration} {pkg.durationUnit}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span>4.8 (24)</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                      {pkg.title}
                    </h3>
                    <Link href={`/${pkg.slug}`}>
                      <Button variant="outline" className="w-full mt-4 border-primary text-primary hover:bg-primary hover:text-white">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-gray-500">
                No featured packages available at the moment.
              </div>
            )}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/packages">
              <Button variant="outline" className="w-full">View all packages</Button>
            </Link>
          </div>
        </section>

        {/* Featured Blogs */}
        <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Stories</h2>
                <p className="text-gray-600 max-w-2xl">
                  Inspiring travel stories and guides from our featured collection.
                </p>
              </div>
              <Link href="/blogs" className="hidden md:flex items-center text-primary font-medium hover:underline">
                Read all stories <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-2xl h-[300px] animate-pulse"></div>
                ))
              ) : featuredBlogs.length > 0 ? (
                featuredBlogs.map((blog) => (
                  <div key={blog.id} className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={blog.featuredImage || 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="text-sm text-primary font-medium mb-2">
                        {new Date(blog.publishedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                        {blog.title}
                      </h3>
                      <p className="text-gray-600 line-clamp-2 mb-4 flex-1">
                        {blog.abstract}
                      </p>
                      <Link href={`/${blog.slug}`} className="inline-flex items-center text-gray-900 font-medium hover:text-primary transition-colors mt-auto">
                        Read More <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-gray-500">
                  No featured blogs available at the moment.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Featured Testimonials */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Travelers Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hear from our happy travelers who have explored the world with us.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-[300px] animate-pulse"></div>
              ))
            ) : featuredTestimonials.length > 0 ? (
              featuredTestimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
                  <Quote className="h-10 w-10 text-primary/20 absolute top-6 right-6" />
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <div
                    className="text-gray-700 mb-6 line-clamp-4 prose prose-sm"
                    dangerouslySetInnerHTML={{ __html: testimonial.description }}
                  />
                  <div className="flex items-center gap-4 mt-auto">
                    <img
                      src={testimonial.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(testimonial.fullName)}
                      alt={testimonial.fullName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900">{testimonial.fullName}</h4>
                      <p className="text-sm text-gray-500">{testimonial.address}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-gray-500">
                No featured testimonials available at the moment.
              </div>
            )}
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
