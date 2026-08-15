# Permission Matrix

| Role | Resource | Action | Context Condition |
| :--- | :--- | :--- | :--- |
| Admin | * | * | All |
| Teacher | Exam | Read | Tenant Match |
| Teacher | Mark | Write | Tenant + Dept Match |
| Student | Result | Read | Tenant + Owner Match |
| Parent | Result | Read | Tenant Match |
