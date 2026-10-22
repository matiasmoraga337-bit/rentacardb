import { Router } from 'express';
import adminRoutes from './admin.routes';
import arriendosRoutes from './arriendos.routes';
import authRoutes from './auth.routes';
import catalogoRoutes from './catalogo.routes';
import conversacionesRoutes from './conversaciones.routes';
import healthRoutes from './health.routes';
import pagosRoutes from './pagos.routes';
import proveedorRoutes from './proveedor.routes';
import reembolsosRoutes from './reembolsos.routes';
import reportesRoutes from './reportes.routes';
import reservasRoutes from './reservas.routes';
import usuariosRoutes from './usuarios.routes';
import vehiculoRoutes from './vehiculo.routes';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/proveedores', proveedorRoutes);
router.use('/vehiculos', vehiculoRoutes);
router.use('/reservas', reservasRoutes);
router.use('/arriendos', arriendosRoutes);
router.use('/conversaciones', conversacionesRoutes);
router.use('/pagos', pagosRoutes);
router.use('/reembolsos', reembolsosRoutes);
router.use('/reportes', reportesRoutes);
router.use('/admin', adminRoutes);
router.use('/', catalogoRoutes);

export default router;
