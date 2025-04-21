import React from "react";
import Slider from "react-slick";
import defaultImage from "../../../assets/images/product.png";
import droneImage from "../../../assets/images/drone-banner.jpg";
import "./CustomerCarousel.css"
const carouselItems = [
  {
    image: droneImage,
    title: "Summer Sale is On!",
    description: "Grab discounts on all products",
    buttonText: "Shop Now",
    buttonLink: "/",
  },
  {
    image: droneImage,
    title: "Summer Sale is On!",
    description: "Grab discounts on all products",
    buttonText: "Shop Now",
    buttonLink: "/",
  },
  {
    image: droneImage,
    title: "Summer Sale is On!",
    description: "Grab discounts on all products",
    buttonText: "Shop Now",
    buttonLink: "/",
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
    <div className="container carousel-container">
      <Slider {...settings}>
        {carouselItems.map((item, index) => (
          <div key={index}  className="carousel-container-content">
            {/* <img
              src={item.image}
              alt={item.title}
              className="carousel-image"
            /> */}
            <div  className="carousel-content">
              <p className="carousel-text" >{item.title}</p>
              <p className="carousel-desc">{item.description}</p>

              <button
                href={item.buttonLink}
                className="carousel-button"
              >
                {item.buttonText}
              </button>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default CarouselLanding;
