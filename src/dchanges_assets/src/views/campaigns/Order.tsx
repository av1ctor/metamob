import React, {useState, ChangeEvent} from "react";
import Panel from "../../components/Panel";
import Container from "../../components/Container";
import SelectField from "../../components/SelectField";
import {Order} from "../../libs/common";

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
        <Panel 
            label="Order"
            collapsed={props.collapsed}
            onToggle={props.onToggle}>
            <Container>
                <SelectField
                    label="Column"
                    name="key"
                    value={form.key || ''}
                    options={props.indexedColumns.map((col) => ({name: col, value: col}))}
                    onChange={changeForm} 
                />
                <SelectField
                    label="Direction"
                    name="dir"
                    value={form.dir || 'asc'}
                    options={[{name: "Asc", value: "asc"}, {name: "Desc", value: "desc"}]}
                    onChange={changeForm} 
                />
            </Container>
            {error && 
                <Container>
                    <div className="form-error">
                        {error}
                    </div>
                </Container>
            }
        </Panel>
    );
};

export default OrderForm;