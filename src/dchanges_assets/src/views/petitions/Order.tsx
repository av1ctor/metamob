import React, {useState, ChangeEvent} from "react";
import Card from "../../components/Card";
import Grid from "../../components/Grid";
import SelectField from "../../components/SelectField";
import {Order} from "../../interfaces/common";

interface Props {
    orderBy: Order;
    indexedColumns: string[];
    collapsed?: boolean;
    onToggle?: () => void;
    onReorder: (orderBy: Order) => void;
};

const OrderForm = (props: Props) => {
    const [form, setForm] = useState(props.orderBy);
    const [error, setError] = useState('');

    const changeForm = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const orderBy = {
            ...form, 
            [e.target.name]: e.target.value
        };
        setForm(orderBy);
        props.onReorder(orderBy);
    };
  
    return (
        <Card 
            label="Order"
            collapsed={props.collapsed}
            onToggle={props.onToggle}>
            <Grid container>
                <Grid>
                    <SelectField
                        label="Column"
                        name="key"
                        value={form.key || ''}
                        options={props.indexedColumns.map((col) => ({name: col, value: col}))}
                        onChange={changeForm} 
                    />
                </Grid>
            </Grid>
            <Grid container>
                <Grid>
                    <SelectField
                        label="Direction"
                        name="dir"
                        value={form.dir || 'asc'}
                        options={[{name: "Asc", value: "asc"}, {name: "Desc", value: "desc"}]}
                        onChange={changeForm} 
                    />
                </Grid>
            </Grid>
            {error && 
                <Grid container>
                    <Grid>
                        <div className="form-error">
                            {error}
                        </div>
                    </Grid>
                </Grid>
            }
        </Card>
    );
};

export default OrderForm;