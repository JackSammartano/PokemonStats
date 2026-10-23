const imagePath = `${import.meta.env.BASE_URL}images/`

export default function SiteBackground() {
  return (
    <picture className="site-background" aria-hidden="true">
      <source media="(max-width: 640px)" type="image/avif" srcSet={`${imagePath}landscape-mobile.avif`} />
      <source media="(max-width: 640px)" type="image/webp" srcSet={`${imagePath}landscape-mobile.webp`} />
      <source type="image/avif" srcSet={`${imagePath}landscape-1600.avif 1600w, ${imagePath}landscape-2400.avif 2400w`} sizes="100vw" />
      <img src={`${imagePath}landscape-1600.webp`} srcSet={`${imagePath}landscape-1600.webp 1600w, ${imagePath}landscape-2400.webp 2400w`} sizes="100vw" alt="" fetchPriority="high" decoding="async" />
    </picture>
  )
}
