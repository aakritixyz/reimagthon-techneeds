"use client";

import Image from 'next/image';
import './homepage.css' ;
import './mobileview.css';
import Glimpses from "../../assets/Glimpse.png";

export default function Glimpse (){  

  return (
    <div>
       <div id="Glimpse">
        <h2>Glimpse</h2>
        <hr className="star-light"></hr>
        <Image src={Glimpses} alt="Glimpse" width={'auto'} height={'auto'} />
        </div>
    </div>
  );
};
