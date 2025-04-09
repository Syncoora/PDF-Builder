import { useEffect, useState } from "react";
import "./App.css";
import Page from "./app/page";

import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();

// monday.setToken("2aa1fd95f2878d57ffcb5e8a905640c4");

function App() {
  const [itemId, setItemId] = useState(null);
  const [itemVariables, setItemVariables] = useState({});

  useEffect(() => {
    monday.listen("context", (res: any) => {
      if (res?.data?.itemId) {
        setItemId(res.data.itemId);
      }
      console.log(res);
    });
  }, []);

  useEffect(() => {
    if (itemId) {
      monday
        .api(
          ` query {
            items (ids: [${itemId}]) {
              id
              name
              column_values {
                column {
                  id
                  title
                }
                id
                type
                value
              }
            }
          }`
        )
        .then((res) => {
          console.log(res);

          if (res.data.items[0]) {
            const variables = {
              id: res.data.items[0].id,
              name: res.data.items[0].name,
            };
            res.data.items[0].column_values.forEach((columnValue: any) => {
              console.log(columnValue);

              if (["text", "numbers"].includes(columnValue.type)) {
                variables[columnValue.column.title] = columnValue.value;
              } else if (columnValue.type === "date") {
                variables[columnValue.column.title] = "";

                if (columnValue.value) {
                  const dateJson = JSON.parse(columnValue.value);

                  if (dateJson.date) {
                    variables[columnValue.column.title] = dateJson.date;
                  }
                }
              }
            });
            setItemVariables(variables);
          }
        });
    }
  }, [itemId]);

  return (
    <>
      <Page sampleData={itemVariables} />
    </>
  );
}

export default App;
