import { Card, Typography, Divider, Stack, Box } from "@mui/material"
import PageContainer from "../../../components/PageContainer"
import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getEmployeeList } from "../../../api/employees"
import { getConstructionList } from "../../../api/constructions"

interface CountCardProps {
    data: number,
    title: string
    onClick?: ()=>void
}

const CountCard = ({data, title, onClick}: CountCardProps) => {

    return (
        <Card 
        variant="outlined" 
        sx={{
    borderRadius: '20px',
    width: '200px',
    height: '200px',
    transition: 'box-shadow 0.2s ease-in-out',
    '&:hover': {
      boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
    },
    cursor: 'pointer'
  }}
  onClick={onClick}
        >

                <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                >
                <Typography gutterBottom variant="h5" component="div" sx={{textAlign: 'center', width: '100%', paddingTop: '5px'}}>
                    {title}
                </Typography>
                </Stack>
            <Divider />
                <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>

                <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '5rem' }}>
                {data ?? '-'}
                </Typography>
                </Box>

    </Card>
    )
}



const Home = () => {

  const navigate = useNavigate();

   const { data: employees} = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployeeList,
  });

  const { data: constructions } = useQuery({
      queryKey: ['constructions'],
      queryFn: getConstructionList,
    });

    const handleEmployeesClick = useCallback(() => {
        navigate('/employees');
      }, [navigate]);

      const handleConstructionsClick = useCallback(() => {
        navigate('/constructions');
      }, [navigate]);

    return (
        <PageContainer
        title={'Strona główna'}
      breadcrumbs={[{ title: 'Strona główna' }]}
      >
        <Stack
        direction={'row'}
        spacing={5}
        >

            <CountCard
                data={employees?.length ?? 0}
                title="Pracownicy"
                onClick={handleEmployeesClick}
            />
            <CountCard
                data={constructions?.length ?? 0}
                title="Budowy"
                onClick={handleConstructionsClick}
            />
        </Stack>
        </PageContainer>
    )
}

export default Home