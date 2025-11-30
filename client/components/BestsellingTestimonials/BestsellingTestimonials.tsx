import { fetchBestsellingTestimonials, Testimonial } from '@/lib/api';
import { IMAGE_URL } from '@/lib/constants';

export default async function BestsellingTestimonials() {
  const testimonials: Testimonial[] = await fetchBestsellingTestimonials();

  if (testimonials.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-8">Bestselling Testimonials</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map(testimonial => (
            <div
              key={testimonial.id}
              className="p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4 mb-4">
                {testimonial.avatar && (
                  <img
                    src={`${IMAGE_URL}${testimonial.avatar}`}
                    alt={testimonial.fullName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{testimonial.fullName}</h3>
                  <p className="text-sm text-gray-600">{testimonial.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}
                  >
                    ★
                  </span>
                ))}
              </div>
              <h4 className="font-medium text-gray-900 mb-2">{testimonial.reviewTitle}</h4>
              <div
                className="text-sm text-gray-600 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: testimonial.description }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
