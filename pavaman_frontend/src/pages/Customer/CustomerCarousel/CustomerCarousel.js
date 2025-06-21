import Slider from "react-slick";
import carouselImage from "../../../assets/images/banner-1.jpg";
import carouselImage2 from "../../../assets/images/banner-2.jpg";

import "./CustomerCarousel.css";

const carouselItems = [
  {
    image: carouselImage,
    alt: "Drone Banner 1",
     texts: [
      "Integrate your power into machines that elevate your dreams.",
    ],
  },
  {
    image: carouselImage2,
    alt: "Drone Banner 2",
    texts: ["Excel proficiency in aviation using cutting-edge technologies"],
  },
];

const CarouselLanding = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
  };
  return (
<div className="carousel-wrapper container">
  <Slider {...settings}>
    {carouselItems.map((item, index) => (
      <div key={index} className="carousel-slide">
        <img src={item.image} alt={item.alt} className="carousel-img" />
        <div
          className={`carousel-text-overlay ${
            index === 0 ? "text-left" : "text-right"
          }`}
        >
          {item.texts.map((text, i) => (
            <p key={i} className="carousel-text">{text}</p>
          ))}
        </div>
      </div>
    ))}
  </Slider>
</div>

  );
};

export default CarouselLanding;
