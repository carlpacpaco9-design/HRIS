import { Document } from "docx";
const doc = new Document({
    sections: [{
        properties: {
            column: { count: 2, space: 720 }
        },
        children: []
    }]
});
