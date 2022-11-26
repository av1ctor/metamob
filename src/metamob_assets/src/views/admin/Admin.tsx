import React, { useContext } from "react";
import Box from "../../components/Box";
import { isModerator } from "../../libs/users";
import { AuthContext } from "../../stores/auth";
import Campaigns from "./campaigns/Campaigns";
import Reports from "./reports/Reports";
import Users from "./users/Users";
import Categories from "./categories/Categories";
import Places from "./places/Places";
import Poaps from "./poaps/Poaps";
import Logs from "./logs/Logs";
import { useUI } from "../../hooks/ui";

interface Props {
};

const Admin = (props: Props) => {
    const [auth, ] = useContext(AuthContext);

    if(!auth.user || !isModerator(auth.user)) {
        return <span>Forbidden</span>;
    }

    return (
        <>
            <div className="page-title has-text-info-dark">
                Admin
            </div>         
            
            <Box>
                <Campaigns />
            </Box>

            <Box>
                <Reports />
            </Box>

            <Box>
                <Users />
            </Box>

            <Box>
                <Places />
            </Box>

            <Box>
                <Categories />
            </Box>

            <Box>
                <Poaps />
            </Box>

            <Box>
                <Logs />
            </Box>

        </>
    );
};

export default Admin;