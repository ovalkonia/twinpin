import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBeforeReg from "../../layouts/headerBeforeReg";

const PageBefortSignUp = () => 
{
    const navigate = useNavigate()
    const [nav, setNav] = useState(false);

    const buttonRedirect = (link : string) =>{
        navigate(`/${link}`)
    }


    return (
        <div style={{ color: "white", fontSize: 12 }}>
            <HeaderBeforeReg />
            asd
            <div>dasd</div>
        </div>
    );
}

export default PageBefortSignUp