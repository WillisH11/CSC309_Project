import React from "react";
import './Button.css';

const STYLEs = [
    "btn--primary",
    "btn--outline"
]

const SIZES = [
    "btn--medium",
    "btn--large"
]


export const Button = ({
    children,
    type,
    onClick,
    buttonStyle,
    buttonSize
}) => {
    const checkButtonStyle = STYLEs.includes(buttonStyle) ? buttonStyle : STYLEs[0];

    const checkButtonSize = SIZES.includes(buttonSize) ? buttonSize : SIZES[0];

    return (
        <button className={`btn ${checkButtonStyle} ${checkButtonSize}`} onClick={onClick} type={type}>
            {children}
        </button>
    )
}