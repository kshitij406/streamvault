import Image from 'next/image';
import { Cast } from '@/types';
import { getImageUrl } from '@/lib/tmdb';

interface Props {
  cast: Cast[];
}

export default function CastRow({ cast }: Props) {
  const top = cast.slice(0, 10);
  if (!top.length) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-8 mb-10">
      <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Cast</h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {top.map((member) => {
          const photo = getImageUrl(member.profile_path, 'w185');
          return (
            <div key={member.id} className="flex-shrink-0 w-24 text-center">
              <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden bg-card mb-2">
                {photo ? (
                  <Image
                    src={photo}
                    alt={member.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-semibold">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-gray-200 truncate leading-tight">{member.name}</p>
              <p className="text-xs text-gray-500 truncate mt-0.5">{member.character}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
