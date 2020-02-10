/* eslint-disable no-console */

import React from "react";

const style = ({ color, padding, border }) => `
    color: ${color};
    padding: ${padding};
    border: ${border};
`;

const HomeRoot = () => {
	return <h1 css={style}>Home Sub</h1>;
};

export default HomeRoot;
