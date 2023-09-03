import React, { lazy, Suspense} from "react";
import {Navigate, useRoutes} from "react-router-dom";

const Scan = lazy(() => import("../pages/scan"));
const router = [
    {
        path: '/', element: <Scan/>,
        children: [
            {
                path: '/scan',
                element: <Scan/>,
            }
        ]
    },
    {path: "*", element: <Navigate to="/"/>},

];

const WrapperRouter = () => {
    let result = useRoutes(router);
    return (
        <Suspense>
            {result}
        </Suspense>
    );
};

export default WrapperRouter;