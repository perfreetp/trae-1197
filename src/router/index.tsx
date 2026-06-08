import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import PublicLayout from '@/layouts/PublicLayout';
import Dashboard from '@/pages/dashboard';
import ProductionList from '@/pages/production';
import NewProduction from '@/pages/production/new';
import ProductionDetail from '@/pages/production/detail';
import Coding from '@/pages/coding';
import Warehouse from '@/pages/warehouse';
import WarehouseIn from '@/pages/warehouse/in';
import WarehouseOut from '@/pages/warehouse/out';
import Recall from '@/pages/recall';
import PublicQuery from '@/pages/query';
import Reports from '@/pages/reports';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'production',
        element: <ProductionList />,
      },
      {
        path: 'production/new',
        element: <NewProduction />,
      },
      {
        path: 'production/:id',
        element: <ProductionDetail />,
      },
      {
        path: 'coding',
        element: <Coding />,
      },
      {
        path: 'warehouse',
        element: <Warehouse />,
      },
      {
        path: 'warehouse/in',
        element: <WarehouseIn />,
      },
      {
        path: 'warehouse/out',
        element: <WarehouseOut />,
      },
      {
        path: 'recall',
        element: <Recall />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
    ],
  },
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        path: 'query',
        element: <PublicQuery />,
      },
    ],
  },
]);

export default router;
